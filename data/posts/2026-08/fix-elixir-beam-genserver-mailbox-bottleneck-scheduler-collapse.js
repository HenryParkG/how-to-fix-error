window.onPostDataLoaded({
    "title": "Fix Elixir BEAM GenServer Mailbox Bottlenecks",
    "slug": "fix-elixir-beam-genserver-mailbox-bottleneck-scheduler-collapse",
    "language": "Elixir / BEAM",
    "code": "ProcessMailboxOverflow",
    "tags": [
        "Elixir",
        "BEAM",
        "Concurrency",
        "Docker",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang VM (BEAM), each process owns a dedicated heap and an unbounded message queue (mailbox). When a central GenServer receives messages at an ingestion rate faster than its synchronous handling capacity, the message queue grows unbounded. As the queue size reaches hundreds of thousands of messages, the BEAM Garbage Collector is forced to scan the expanding heap and message queue structures during minor and major GC sweeps.</p><p>This causes GC execution times to spike drastically, exhausting the reduction budget of the BEAM scheduler thread assigned to that process. Consequently, the scheduler thread remains trapped in heavy GC cycles and priority handling, inducing latency cascades across co-located processes and leading to full scheduler collapse and cluster node timeouts.</p>",
    "root_cause": "Single-process sequential message handling combined with unbounded asynchronous casts and un-indexed selective message receives, creating exponential garbage collection latency and CPU reduction budget exhaustion.",
    "bad_code": "defmodule CoreMetrics.Collector do\n  use GenServer\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n  def ingest_metric(metric), do: GenServer.cast(__MODULE__, {:ingest, metric})\n\n  @impl true\n  def init(_opts), do: {:ok, []}\n\n  @impl true\n  def handle_cast({:ingest, metric}, state) do\n    # Expensive transformation and external write inside single process\n    :timer.sleep(2) \n    processed = transform_metric(metric)\n    {:noreply, [processed | state]}\n  end\n\n  defp transform_metric(m), do: Map.put(m, :timestamp, System.system_time())\nend",
    "solution_desc": "Decouple ingestion from processing by routing writes across a pool of partitioned workers using PartitionSupervisor or dynamic ETS concurrent write buffers, and enforce bounded backpressure to drop or throttle excessive load.",
    "good_code": "defmodule CoreMetrics.Pipeline do\n  use Supervisor\n\n  def start_link(init_arg) do\n    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)\n  end\n\n  @impl true\n  def init(_init_arg) do\n    children = [\n      # Partitioned worker pool distributing load across BEAM schedulers\n      {PartitionSupervisor,\n       child_spec: CoreMetrics.Worker,\n       name: CoreMetrics.WorkerPool,\n       partitions: System.schedulers_online()}\n    ]\n\n    Supervisor.init(children, strategy: :one_for_one)\n  end\n\n  def ingest_metric(metric) do\n    key = :erlang.phash2(metric.device_id, System.schedulers_online())\n    \n    case PartitionSupervisor.which_children(CoreMetrics.WorkerPool) do\n      workers when is_list(workers) ->\n        {_, worker_pid, _, _} = Enum.at(workers, key)\n        # Enforce backpressure by checking queue length or calling with bounded timeout\n        {:message_queue_len, len} = Process.info(worker_pid, :message_queue_len)\n        if len < 5_000 do\n          GenServer.cast(worker_pid, {:ingest, metric})\n          :ok\n        else\n          {:error, :overloaded}\n        end\n    end\n  end\nend",
    "verification": "Inspect BEAM process queues in real time via `:observer.start()` or execute `:erlang.process_info(pid, :message_queue_len)` under high load to verify queue depth stays within safety thresholds without scheduler thread starvation.",
    "date": "2026-08-23",
    "id": 1787476727,
    "type": "error"
});