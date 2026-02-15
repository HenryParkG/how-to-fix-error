window.onPostDataLoaded({
    "title": "Fixing Selective Receive Starvation in Elixir OTP",
    "slug": "elixir-otp-selective-receive-fix",
    "language": "Elixir",
    "code": "GenServer Mailbox Bloat",
    "tags": [
        "Go",
        "Node.js",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir/Erlang, 'selective receive' occurs when a process uses a `receive` block with a pattern that doesn't match the oldest messages in its mailbox. The VM must scan every message in the mailbox until it finds a match. In high-throughput GenServers, this causes O(N) overhead per message, leading to severe latency and eventual process crashes due to memory exhaustion.</p>",
    "root_cause": "The mailbox grows indefinitely with non-matching messages, forcing the Erlang scheduler to traverse thousands of items for every single matching operation.",
    "bad_code": "def loop(state) do\n  receive do\n    {:priority, msg} -> \n      handle_msg(msg, state)\n      loop(state)\n    # Missing catch-all causes non-priority messages to rot in mailbox\n  end\nend",
    "solution_desc": "Migrate logic to a standard `GenServer` behavior where `handle_info/2` processes messages in the order they arrive. If priority is needed, implement an internal priority queue within the state rather than relying on mailbox scanning.",
    "good_code": "def handle_info({:priority, msg}, state) do\n  handle_msg(msg, state)\n  {:noreply, state}\nend\n\ndef handle_info(_unknown, state) do\n  # Always consume unknown messages to keep mailbox clean\n  {:noreply, state}\nend",
    "verification": "Use `:erlang.process_info(pid, :message_queue_len)` to monitor mailbox size under high load.",
    "date": "2026-02-15",
    "id": 1771131002,
    "type": "error"
});