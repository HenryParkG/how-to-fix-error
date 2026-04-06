window.onPostDataLoaded({
    "title": "Resolving Elixir Selective Receive Mailbox Bottlenecks",
    "slug": "elixir-otp-selective-receive-fix",
    "language": "Elixir",
    "code": "OTP_MAILBOX_CONGESTION",
    "tags": [
        "Backend",
        "Rust",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Selective receive occurs when an Elixir process uses a `receive` block with a specific pattern match that doesn't match the oldest messages in the mailbox. The BEAM VM must scan the entire mailbox to find a match. If the mailbox grows to thousands of messages, every new message arrival triggers an O(N) scan, leading to high CPU usage and process starvation.</p>",
    "root_cause": "The process mailbox contains many non-matching messages, forcing the VM to traverse the entire linked list for every 'receive' call.",
    "bad_code": "def loop(state) do\n  receive do\n    {:important_msg, data} -> \n      handle_data(data)\n      loop(state)\n    # Missing generic match, non-important messages pile up\n  end\nend",
    "solution_desc": "Always implement a catch-all match in the receive loop or use GenServer which handles the mailbox sequentially. By processing or discarding unknown messages immediately, the mailbox remains small and lookup time stays O(1).",
    "good_code": "def loop(state) do\n  receive do\n    {:important_msg, data} -> \n      handle_data(data)\n      loop(state)\n    _other -> \n      # Drain the mailbox of unhandled messages\n      loop(state)\n  after 0 -> \n      state\n  end\nend",
    "verification": "Monitor process mailbox size using `:erlang.process_info(pid, :message_queue_len)` and observe latency under load.",
    "date": "2026-04-06",
    "id": 1775452577,
    "type": "error"
});