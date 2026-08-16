window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Bloat & Supervisor Cascades",
    "slug": "elixir-genserver-mailbox-bloat-supervision-restarts",
    "language": "Elixir",
    "code": "GenServerMailboxOverflow",
    "tags": [
        "Elixir",
        "Concurrency",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In BEAM architectures, an Elixir <code>GenServer</code> processes messages sequentially from its process mailbox. When incoming message throughput outpaces the process's sequential execution capacity\u2014often exacerbated by synchronous external I/O or blocking operations\u2014the mailbox swells unboundedly.</p><p>As memory consumption escalates, the BEAM garbage collector consumes disproportionate CPU cycles scanning the expanding heap. If memory thresholds are breached or synchronous callers timeout with <code>:timeout</code> exits, downstream caller processes crash. If these crashes cross the supervisor's <code>max_restarts</code> limit within <code>max_seconds</code>, the supervisor terminates itself, triggering a cascading shutdown across the entire supervision tree.</p>",
    "root_cause": "Blocking operations executed synchronously inside `handle_cast/2` or `handle_call/3`, combined with unbounded ingress queues and tight supervisor restart tolerances (`max_restarts: 3, max_seconds: 5`), resulting in process crashes that escalate to supervisor termination.",
    "bad_code": "defmodule Core.TelemetryConsumer do\n  use GenServer\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n  def push_metric(metric), do: GenServer.cast(__MODULE__, {:metric, metric})\n\n  @impl true\n  def init(state), do: {:ok, state}\n\n  @impl true\n  def handle_cast({:metric, metric}, state) do\n    # ANTI-PATTERN: Blocking external HTTP/DB call inside message loop\n    :timer.sleep(50) # Simulating slow I/O\n    Core.Database.insert_metric(metric)\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Decouple ingestion from processing by implementing backpressure and asynchronous worker pools. Use bounded queues with GenStage/Broadway, offload blocking tasks to dynamic `Task.Supervisor` processes with controlled concurrency, and configure supervisor restart strategies to prevent cascade collapses.",
    "good_code": "defmodule Core.TelemetryConsumer do\n  use GenServer\n  require Logger\n\n  @max_queue_len 5_000\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n\n  def push_metric(metric) do\n    case :erlang.process_info(Process.whereis(__MODULE__), :message_queue_len) do\n      {:message_queue_len, len} when len > @max_queue_len ->\n        {:error, :overloaded}\n      _ ->\n        GenServer.cast(__MODULE__, {:metric, metric})\n    end\n  end\n\n  @impl true\n  def init(state), do: {:ok, state}\n\n  @impl true\n  def handle_cast({:metric, metric}, state) do\n    # Offload I/O asynchronously to a supervised Task pool\n    Task.Supervisor.start_child(Core.MetricTaskSupervisor, fn ->\n      Core.Database.insert_metric(metric)\n    end)\n    {:noreply, state}\n  end\nend",
    "verification": "Monitor process mailbox size with `:erlang.process_info(pid, :message_queue_len)` under load testing (e.g., k6). Verify that when throughput spikes, the GenServer drops or throttles requests gracefully (`{:error, :overloaded}`) rather than blowing heap memory and crashing parent supervisors.",
    "date": "2026-08-16",
    "id": 1786851663,
    "type": "error"
});