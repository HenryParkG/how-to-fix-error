window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Saturation & Tree Crash",
    "slug": "elixir-genserver-mailbox-saturation-cascade",
    "language": "Elixir",
    "code": "ProcessKilledError",
    "tags": [
        "Elixir",
        "Concurrency",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang VM (BEAM), each process possesses an unbounded message mailbox. When messages arrive faster than a <code>GenServer</code> can evaluate <code>handle_cast/2</code> or <code>handle_call/3</code> callbacks, the process mailbox swells. This causes two cascading points of failure: rapid consumption of node RAM leading to Out-Of-Memory (OOM) killer intervention, and client callers timing out after the standard 5,000ms threshold.</p><p>As callers crash from <code>:timeout</code> exits, parent supervisors trigger cascading restarts. When restart thresholds (e.g., more than 3 restarts in 5 seconds) are exceeded, the root supervisor terminates, bringing down the entire application container.</p>",
    "root_cause": "Unbounded sequential processing of asynchronous casts creates mailbox memory explosion and client timeouts, breaching supervisor restart limits across the supervision tree.",
    "bad_code": "defmodule IngestionServer do\n  use GenServer\n\n  def start_link(_), do: GenServer.start_link(__MODULE__, [], name: __MODULE__)\n  def ingest(event), do: GenServer.cast(__MODULE__, {:ingest, event})\n\n  def init(_), do: {:ok, %{}}\n\n  # Inbound traffic exceeds 10k req/sec while processing takes 10ms each\n  def handle_cast({:ingest, event}, state) do\n    Process.sleep(10) # Heavy processing/database persistence\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Replace unthrottled casts with backpressure mechanisms using GenStage/Broadway, worker pooling via `NimblePool`, or mailbox monitoring that sheds load or switches callers to synchronous backpressure when queue size exceeds safety thresholds.",
    "good_code": "defmodule IngestionServer do\n  use GenServer\n  @max_mailbox_limit 2500\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n\n  def ingest(event) do\n    case Process.whereis(__MODULE__) do\n      nil -> {:error, :unavailable}\n      pid ->\n        {:message_queue_len, len} = Process.info(pid, :message_queue_len)\n        if len > @max_mailbox_limit do\n          {:error, :overloaded} # Backpressure / Load shed\n        else\n          GenServer.call(__MODULE__, {:ingest, event}, 2000)\n        end\n    end\n  end\n\n  def init(_), do: {:ok, %{}}\n\n  def handle_call({:ingest, event}, _from, state) do\n    # Offload actual work to dedicated Task workers or dynamic supervisors\n    Task.Supervisor.start_child(IngestionTaskSupervisor, fn ->\n      process_event(event)\n    end)\n    {:reply, :ok, state}\n  end\n\n  defp process_event(_event), do: :ok\nend",
    "verification": "Inspect queue size using `:erlang.process_info(pid, :message_queue_len)` under benchmark tools like `k6` or `wrk`. Verify memory stays bounded without supervisor restarts.",
    "date": "2026-09-12",
    "id": 1789216280,
    "type": "error"
});