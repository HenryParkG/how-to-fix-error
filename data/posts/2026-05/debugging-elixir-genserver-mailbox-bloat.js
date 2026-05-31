window.onPostDataLoaded({
    "title": "Debugging Elixir GenServer Mailbox Bloat",
    "slug": "debugging-elixir-genserver-mailbox-bloat",
    "language": "Elixir",
    "code": "OutOfMemory",
    "tags": [
        "Elixir",
        "Concurrency",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Elixir's concurrency model relies on lightweight processes communicating via message passing. Every process has an unbounded mailbox. When a GenServer receives messages faster than its single-threaded execution loop can handle them (e.g., under high-throughput writes), its mailbox size grows exponentially.</p><p>This mailbox bloat leads to severe performance degradation. Since mailbox scanning in the BEAM is linear for pattern matching, a bloated mailbox slows down message retrieval. Eventually, the BEAM VM consumes all host memory, resulting in an OS Out-Of-Memory (OOM) crash. This is especially prevalent when producers use asynchronous <code>GenServer.cast/2</code> without any backpressure mechanism to throttle incoming load.</p>",
    "root_cause": "Unbounded message queue (mailbox) growth caused by high-rate asynchronous 'cast' operations without backpressure or producer-side throttling.",
    "bad_code": "defmodule UnboundedWorker do\n  use GenServer\n\n  def start_link(_opts), do: GenServer.start_link(__MODULE__, :ok, name: __MODULE__)\n\n  # Asynchronous cast provides no backpressure\n  def push_data(data), do: GenServer.cast(__MODULE__, {:data, data})\n\n  def init(state), do: {:ok, state}\n\n  def handle_cast({:data, _data}, state) do\n    # Simulate slow IO / processing\n    Process.sleep(100)\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Replace asynchronous `GenServer.cast` operations with synchronous `GenServer.call` interactions to block the caller until processing is complete, naturally establishing backpressure. Alternatively, monitor mailbox size and reject requests beyond a safe threshold.",
    "good_code": "defmodule BoundedWorker do\n  use GenServer\n\n  @max_mailbox_size 5000\n\n  def start_link(_opts), do: GenServer.start_link(__MODULE__, :ok, name: __MODULE__)\n\n  # Using synchronous call blocks caller, forcing natural backpressure\n  def push_data(data) do\n    case Process.info(Process.whereis(__MODULE__), :message_queue_len) do\n      {:message_queue_len, len} when len > @max_mailbox_size ->\n        {:error, :overloaded}\n      _ ->\n        GenServer.call(__MODULE__, {:data, data}, 5000)\n    end\n  end\n\n  def init(state), do: {:ok, state}\n\n  def handle_call({:data, _data}, _from, state) do\n    Process.sleep(100) # Processing simulated\n    {:reply, :ok, state}\n  end\nend",
    "verification": "Load test the process using concurrent Task.async spawns. Assert that the mailbox size never exceeds the configured limit and that excess requests receive an {:error, :overloaded} response instead of crashing the BEAM node.",
    "date": "2026-05-31",
    "id": 1780210284,
    "type": "error"
});