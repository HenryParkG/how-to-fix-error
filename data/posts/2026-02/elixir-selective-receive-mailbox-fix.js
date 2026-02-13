window.onPostDataLoaded({
    "title": "Solving Elixir GenServer Mailbox Congestion",
    "slug": "elixir-selective-receive-mailbox-fix",
    "language": "Elixir",
    "code": "MailboxCongestion",
    "tags": [
        "Go",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir/Erlang, 'selective receive' occurs when you use a receive block that only matches specific patterns while ignoring others. If a process receives a high volume of messages that don't match the current receive pattern, those messages accumulate in the process mailbox. Every subsequent receive call must scan through these ignored messages, leading to O(N) complexity per scan and eventual process exhaustion.</p>",
    "root_cause": "The BEAM virtual machine scans the mailbox from oldest to newest. If the first message doesn't match the pattern, it's skipped and the next is checked. If thousands of messages are skipped, CPU usage spikes and the process becomes unresponsive.",
    "bad_code": "def loop(state) do\n  receive do\n    {:priority, msg} -> \n       handle_priority(msg)\n       loop(state)\n    # If other messages arrive, they stay in the mailbox\n    # and are scanned every time we look for :priority\n  end\nend",
    "solution_desc": "Avoid manual 'receive' blocks inside GenServers. Instead, rely on the GenServer's native 'handle_info/2' callbacks. GenServers are designed to consume the mailbox sequentially. If you need priority, implement a separate priority queue structure or use multiple processes to isolate different message types.",
    "good_code": "def handle_info({:priority, msg}, state) do\n  handle_priority(msg)\n  {:noreply, state}\nend\n\ndef handle_info(_other, state) do\n  # Always match and discard or handle unknown messages\n  {:noreply, state}\nend",
    "verification": "Check 'Process.info(pid, :message_queue_len)' in the observer or IEx shell to ensure the mailbox is not growing indefinitely.",
    "date": "2026-02-13",
    "id": 1770975348,
    "type": "error"
});