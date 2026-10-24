window.onPostDataLoaded({
    "title": "Fix Elixir GenServer Mailbox Bloat in Selective Receive",
    "slug": "fix-elixir-genserver-mailbox-selective-receive-bloat",
    "language": "Elixir",
    "code": "ProcessMailboxOverflow",
    "tags": [
        "Rust",
        "Backend",
        "Elixir",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang VM (BEAM), each process has an unbounded, sequential message queue known as its mailbox. A standard GenServer processes incoming messages sequentially via its main loop (calling <code>handle_info/2</code>, <code>handle_cast/2</code>, or <code>handle_call/3</code>). However, developers frequently introduce explicit <code>receive do ... end</code> blocks inside a GenServer callback\u2014most commonly when awaiting a synchronous response like an HTTP request, Task await, or distributed RPC.</p><p>When an explicit <code>receive</code> block specifies pattern matching that does not match older or concurrently incoming messages, BEAM engages in selective receive. It scans down the mailbox queue pointer by pointer. Every message that does not match the block pattern remains in the queue and is skipped. If messages arrive at a high rate while the GenServer waits for a specific correlation ID or external response, the queue grows linearly. Subsequent selective receives must traverse thousands of unmatched messages, causing quadratic $O(N)$ scanning latency, massive memory allocation per scan, scheduler collapse, and eventual node-wide out-of-memory crashes.</p>",
    "root_cause": "Invoking an explicit `receive` block inside a GenServer loop triggers selective mailbox traversal, skipping interleaved cast/call/info messages and forcing subsequent scans to navigate an exponentially growing message queue.",
    "bad_code": "defmodule IngestWorker do\n  use GenServer\n\n  def handle_cast({:process_batch, payload}, state) do\n    # Spawns a task and uses explicit receive to await the token\n    ref = make_ref()\n    task = Task.async(fn -> ExternalClient.post(payload, ref) end)\n    \n    # BUG: Explicit selective receive inside GenServer loop\n    # All interleaved {:process_batch, _} calls remain unmatched in the mailbox!\n    receive do\n      {^ref, result} ->\n        {:noreply, update_metrics(state, result)}\n    after\n      5000 ->\n        {:noreply, state}\n    end\n  end\nend",
    "solution_desc": "Never execute explicit selective receives inside a GenServer message loop. Instead, utilize asynchronous task monitoring (`Task.Supervisor.async_nolink/2`) and handle the task response within the natural GenServer `handle_info/2` lifecycle. Messages are consumed off the front of the queue sequentially ($O(1)$) without mailbox traversal, preventing latency degradation and memory inflation.",
    "good_code": "defmodule IngestWorker do\n  use GenServer\n\n  def handle_cast({:process_batch, payload}, state) do\n    # Run task asynchronously without blocking or selective receive\n    task = Task.Supervisor.async_nolink(IngestTaskSupervisor, fn ->\n      ExternalClient.post(payload)\n    end)\n\n    # Store Task reference in process state\n    {:noreply, Map.put(state, task.ref, :pending)}\n  end\n\n  # Process task completion through normal FIFO queue consumption\n  def handle_info({ref, result}, state) when is_map_key(state, ref) do\n    Process.demonitor(ref, [:flush])\n    new_state = state |> Map.delete(ref) |> update_metrics(result)\n    {:noreply, new_state}\n  end\n\n  def handle_info({:DOWN, ref, :process, _pid, _reason}, state) do\n    {:noreply, Map.delete(state, ref)}\n  end\nend",
    "verification": "Run `:erlang.process_info(pid, :message_queue_len)` under load tests. The queue count should stabilize near single digits rather than continuously scaling into tens of thousands.",
    "date": "2026-10-24",
    "id": 1792828268,
    "type": "error"
});