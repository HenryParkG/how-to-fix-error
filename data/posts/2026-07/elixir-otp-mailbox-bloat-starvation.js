window.onPostDataLoaded({
    "title": "Fixing Elixir OTP Mailbox Bloat and Starvation",
    "slug": "elixir-otp-mailbox-bloat-starvation",
    "language": "Elixir",
    "code": "Mailbox Bloat",
    "tags": [
        "Docker",
        "Backend",
        "Elixir",
        "Error Fix"
    ],
    "analysis": "<p>In Erlang and Elixir's Actor model, each process possesses an unbounded message queue (mailbox). If a process receives messages at a rate higher than its processing capability, the mailbox bloats. This results in high memory consumption, garbage collection thrashing, and increased read latencies for critical administrative tasks, ultimately triggering Out-of-Memory (OOM) crashes.</p><p>Furthermore, because standard message matching scans the mailbox sequentially, a bloated queue leads to performance degradation (O(N) search complexity) when using selective receives, starving high-priority messages and locking up OTP supervisor trees.</p>",
    "root_cause": "The root cause is the absence of backpressure or rate-limiting in high-throughput ingress pipelines. When a GenServer synchronously processes heavy business logic directly inside handle_cast or handle_info, it fails to keep pace with parallel client requests.",
    "bad_code": "defmodule IngestionServer do\n  use GenServer\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n  def init(state), do: {:ok, state}\n\n  # DANGER: Heavy compute and database insertion inside the main loop.\n  # If messages arrive at 10k rps, the mailbox will bloat and crash the node.\n  def handle_cast({:track_event, event}, state) do\n    Process.sleep(50) # Simulating DB latency\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Architect a solution using backpressure mechanisms and dynamic pools. Instead of handling processing within the main GenServer loop, use a consumer/producer design pattern (such as GenStage) or dynamically delegate jobs to a task supervisor while actively checking the mailbox length using `:erlang.process_info/2` to shed load dynamically when queue thresholds are breached.",
    "good_code": "defmodule IngestionServer do\n  use GenServer\n  require Logger\n\n  @max_queue_len 5000\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n  def init(state), do: {:ok, state}\n\n  def handle_cast({:track_event, event}, state) do\n    case Process.info(self(), :message_queue_len) do\n      {:message_queue_len, len} when len > @max_queue_len ->\n        Logger.error(\"Mailbox threshold exceeded: dropping message to prevent OOM\")\n        {:noreply, state}\n      _ ->\n        # Offload logic asynchronously to a Task supervisor to free mailbox processing loop\n        Task.Supervisor.start_child(IngestionTaskSupervisor, fn ->\n          Process.sleep(50) # Simulated database latency\n        end)\n        {:noreply, state}\n      end\n  end\nend",
    "verification": "Inject concurrent requests into the system using a load testing tool like Wrk or Benchmee. Monitor process memory and queue lengths using `:observer` or `:erlang.process_info(pid, :message_queue_len)` to verify that maximum bounds are strictly maintained and load shedding kicks in.",
    "date": "2026-07-14",
    "id": 1783992617,
    "type": "error"
});