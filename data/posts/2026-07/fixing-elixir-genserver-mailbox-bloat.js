window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Bloat",
    "slug": "fixing-elixir-genserver-mailbox-bloat",
    "language": "Elixir",
    "code": "Mailbox Bloat",
    "tags": [
        "Go",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir and the Erlang VM (BEAM), processes communicate via message passing, utilizing unbounded mailboxes. When a GenServer receives messages faster than its execution loop can process them, the message queue builds up. Unbounded growth leads to heap exhaustion, causing the entire node to crash due to out-of-memory (OOM) failures. This failure mode typically occurs during high-throughput ingestions when downstream dependencies run into backpressure issues, but the input ingestion doesn't back off.</p>",
    "root_cause": "Using asynchronous `GenServer.cast/2` or raw `send/2` mechanisms to push messages into a processing server without structural backpressure, rate-limiting, or load-shedding mechanisms.",
    "bad_code": "defmodule Ingestor do\n  use GenServer\n\n  def start_link(_) do\n    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)\n  end\n\n  # BUG: Asynchronous, unbounded cast allows calling processes to bloat mailbox\n  def submit_work(data) do\n    GenServer.cast(__MODULE__, {:process, data})\n  end\n\n  @impl true\n  def init(state) do\n    {:ok, state}\n  end\n\n  @impl true\n  def handle_cast({:process, data}, state) do\n    # Downstream delay simulating database write\n    Process.sleep(20)\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Implement load-shedding and synchronous backpressure. Replace async casts with a regulated synchronous `GenServer.call/3` that enforces a strict timeout, or dynamically check the message queue length of the worker before enqueueing new work. If the queue length exceeds a safe threshold, reject the message early with an overload error.",
    "good_code": "defmodule SafeIngestor do\n  use GenServer\n  require Logger\n\n  @max_queue_limit 5000\n  @timeout_ms 5000\n\n  def start_link(_) do\n    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)\n  end\n\n  # FIX: Apply natural backpressure by combining queue length checks with sync calls\n  def submit_work(data) do\n    case Process.info(Process.whereis(__MODULE__), :message_queue_len) do\n      {:message_queue_len, len} when len > @max_queue_limit ->\n        {:error, :overloaded} # Early drop (Load-shedding)\n      _ ->\n        try do\n          GenServer.call(__MODULE__, {:process, data}, @timeout_ms)\n        catch\n          :exit, {:timeout, _} -> {:error, :timeout}\n        end\n    end\n  end\n\n  @impl true\n  def init(state) do\n    {:ok, state}\n  end\n\n  @impl true\n  def handle_call({:process, data}, _from, state) do\n    Process.sleep(20) \n    {:reply, :ok, state}\n  end\nend",
    "verification": "Run a concurrent load test using `Task.async_stream` pushing 50,000 tasks. The bad code will crash the VM with memory starvation. The fixed code will smoothly shed overload requests, keeping the BEAM process queue well within bounds.",
    "date": "2026-07-19",
    "id": 1784425646,
    "type": "error"
});