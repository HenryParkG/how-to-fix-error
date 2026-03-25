window.onPostDataLoaded({
    "title": "Resolving Elixir Selective Receive Mailbox Bottlenecks",
    "slug": "elixir-selective-receive-bottlenecks",
    "language": "Elixir",
    "code": "SelectiveReceiveStall",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir and Erlang, 'selective receive' occurs when a process searches its mailbox for a message matching a specific pattern (e.g., a specific reference). While powerful, if the target message is not at the head of the mailbox, the runtime must scan every preceding message.</p><p>In high-throughput GenServers, this scan becomes an O(N) operation. As the mailbox grows to thousands of messages, the CPU spends more time scanning discarded messages than processing valid ones, leading to a death spiral where latency increases and the mailbox continues to swell.</p>",
    "root_cause": "The BEAM VM scans the entire message queue from the beginning for every 'receive' block that doesn't match the head message, leading to quadratic complexity in processing.",
    "bad_code": "def handle_info(:work, state) do\n  # This triggers a scan of the entire mailbox for a specific ref\n  ref = make_ref()\n  send(self(), {:target, ref, \"data\"})\n  receive do\n    {:target, ^ref, val} -> {:noreply, state}\n  after\n    1000 -> {:noreply, state}\n  end\nend",
    "solution_desc": "Avoid using 'receive' blocks inside GenServer callbacks. Instead, use the GenServer's native message handling loop (handle_info) to process messages as they arrive at the head of the queue, maintaining state manually if a correlation ID is needed.",
    "good_code": "def handle_info(:work, state) do\n  ref = make_ref()\n  send(self(), {:target, ref, \"data\"})\n  # Store the ref in state and return to the main loop\n  {:noreply, %{state | pending_refs: [ref | state.pending_refs]}}\nend\n\ndef handle_info({:target, ref, val}, state) do\n  # Handled naturally at the head of the mailbox\n  new_refs = List.delete(state.pending_refs, ref)\n  {:noreply, %{state | pending_refs: new_refs}}\nend",
    "verification": "Monitor :message_queue_len using Process.info(pid) and check for high reductions/CPU usage without corresponding output throughput.",
    "date": "2026-03-25",
    "id": 1774421605,
    "type": "error"
});