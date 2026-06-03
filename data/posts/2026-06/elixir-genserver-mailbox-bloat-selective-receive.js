window.onPostDataLoaded({
    "title": "Debugging Elixir GenServer Mailbox Bloat",
    "slug": "elixir-genserver-mailbox-bloat-selective-receive",
    "language": "Elixir",
    "code": "SelectiveReceiveOverflow",
    "tags": [
        "Elixir",
        "Erlang",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir and the Erlang VM (BEAM), every process has an isolated message mailbox. When a process receives messages faster than it can process them, or if it utilizes manual nested pattern matching on its inbox, mailbox bloat occurs. Under a selective receive bottleneck, the process VM thread must scan the entire mailbox linearly to find a matching pattern. For an overflowing mailbox containing tens of thousands of messages, this linear $O(N)$ scan runs on every message retrieval, triggering severe CPU starvation and cascading node failures.</p>",
    "root_cause": "The root cause is executing a manual, blocking 'receive' block inside a GenServer callback (such as handle_call/3 or handle_cast/2). Because GenServer runs its own native message processing loop, introducing a nested 'receive' forces Erlang to scan past all already-buffered GenServer system messages and cast payloads to match the specific nested pattern, turning a highly efficient message queue into a performance bottleneck.",
    "bad_code": "defmodule InvoiceProcessor do\n  use GenServer\n\n  def handle_call({:process_batch, batch_id}, _from, state) do\n    # BUG: Nested manual receive causes selective receive scan over the whole mailbox\n    receive do\n      {:batch_ready, ^batch_id, data} ->\n        {:reply, {:ok, data}, state}\n    after\n      5000 -> \n        {:reply, {:error, :timeout}, state}\n    end\n  end\nend",
    "solution_desc": "To fix this, eliminate manual nested 'receive' blocks within GenServer lifecycle callbacks. Instead, handle asynchronous requests natively by delegating the background task to an independent process or Task. Store the caller's reference ('from') in the GenServer's state, return a ':noreply' status immediately to keep the GenServer loop unblocked, and use 'GenServer.reply/2' inside a dedicated 'handle_info/2' callback once the data is received.",
    "good_code": "defmodule InvoiceProcessor do\n  use GenServer\n\n  def handle_call({:process_batch, batch_id}, from, state) do\n    # Delegate to a separate Task, keeping the main GenServer mailbox processing free\n    Task.start_link(fn ->\n      data = Worker.perform_job(batch_id)\n      send(self(), {:batch_ready, from, data})\n    end)\n    \n    {:noreply, state}\n  end\n\n  # Receive the result natively without blocking the main event loop\n  def handle_info({:batch_ready, from, data}, state) do\n    GenServer.reply(from, {:ok, data})\n    {:noreply, state}\n  end\nend",
    "verification": "Deploy the fix and inspect the process mailbox queue length by executing ':erlang.process_info(pid, :message_queue_len)' in an 'iex' console. Simulate a high-concurrency payload with 100,000 asynchronous messages and confirm that queue length stays close to zero and latency remains at $O(1)$ constant time.",
    "date": "2026-06-03",
    "id": 1780455060,
    "type": "error"
});