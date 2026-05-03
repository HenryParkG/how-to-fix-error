window.onPostDataLoaded({
    "title": "Resolving Elixir OTP Mailbox Bottlenecks",
    "slug": "elixir-otp-mailbox-selective-receive-fix",
    "language": "Elixir",
    "code": "Performance Bottleneck",
    "tags": [
        "Elixir",
        "Backend",
        "Erlang",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir's Erlang VM (BEAM), processes communicate via message passing. When a process uses a 'selective receive' (a receive block with a specific pattern), the VM must scan the process's mailbox from the beginning to find a match. If the mailbox grows large and the desired message is at the end, the scan becomes an O(n) operation per message, leading to quadratic complexity and CPU exhaustion.</p>",
    "root_cause": "The selective receive pattern forces the VM to traverse and skip unmatched messages repeatedly, which becomes computationally expensive as mailbox pressure increases.",
    "bad_code": "def loop(state) do\n  receive do\n    {:priority_action, data} -> \n      handle_priority(data)\n      loop(state)\n    # If other messages arrive first, the VM scans them every time\n  end\nend",
    "solution_desc": "Refactor the process into a GenServer. GenServers process the mailbox sequentially via the `handle_info/2` callback. This ensures each message is dequeued and handled or stored in the process state, avoiding the re-scanning of the mailbox.",
    "good_code": "def handle_info({:priority_action, data}, state) do\n  handle_priority(data)\n  {:noreply, state}\nend\n\ndef handle_info(_other, state) do\n  # Always consume unknown messages to keep mailbox clean\n  {:noreply, state}\nend",
    "verification": "Monitor process mailbox size using `:erlang.process_info(pid, :message_queue_len)` and check CPU utilization under high load.",
    "date": "2026-05-03",
    "id": 1777794521,
    "type": "error"
});