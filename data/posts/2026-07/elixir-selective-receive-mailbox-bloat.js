window.onPostDataLoaded({
    "title": "Fixing Elixir Selective Receive Mailbox Bloat",
    "slug": "elixir-selective-receive-mailbox-bloat",
    "language": "Elixir",
    "code": "Mailbox Bloat",
    "tags": [
        "Elixir",
        "OTP",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir's actor model, processes communicate via asynchronous message passing. When a process uses selective receive (matching specific patterns), unmatched messages remain in the process mailbox. Over time, this mailbox grows, causing the BEAM VM to traverse an increasingly large message queue for every subsequent receive operation, leading to severe CPU consumption and latency degradation.</p>",
    "root_cause": "A pattern-match in a receive block that does not have a fallback clause, combined with a high volume of unexpected messages, forcing the VM to scan the entire mailbox linearly.",
    "bad_code": "def handle_info(:work, state) do\n  receive do\n    {:target_msg, data} -> process(data)\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Avoid nested or explicit selective receive blocks inside GenServer callbacks. Use standard GenServer handle_info/2 callbacks to handle all incoming messages, and implement a wildcard match to discard unknown messages safely.",
    "good_code": "def handle_info({:target_msg, data}, state) do\n  process(data)\n  {:noreply, state}\nend\n\ndef handle_info(_unexpected, state) do\n  {:noreply, state}\nend",
    "verification": "Monitor process mailbox size using :erlang.process_info(pid, :message_queue_len) under load tests.",
    "date": "2026-07-08",
    "id": 1783475382,
    "type": "error"
});