window.onPostDataLoaded({
    "title": "Mitigating Elixir BEAM Livelock from Selective Receive",
    "slug": "elixir-beam-selective-receive-livelock",
    "language": "Erlang/Elixir",
    "code": "SchedulerLivelock",
    "tags": [
        "Go",
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Selective receive in Elixir/Erlang allows a process to prioritize specific messages in its mailbox. However, if the mailbox grows significantly (e.g., thousands of messages) and the process continues to look for a message that isn't there, the BEAM VM must scan the entire mailbox linearly for every attempt. This O(N) operation consumes 100% CPU on the scheduler thread, preventing other processes from making progress\u2014a state known as livelock.</p>",
    "root_cause": "A large process mailbox combined with a receive block that does not match the oldest messages, forcing a full mailbox scan on every loop iteration.",
    "bad_code": "def loop(state) do\n  receive do\n    {:priority_msg, data} -> \n      handle_priority(data)\n      loop(state)\n    # Missing a catch-all for regular messages\n  end\nend",
    "solution_desc": "Ensure messages are processed in the order they arrive or use separate processes (or GenServers) to handle different message types. Use a 'flush' or a catch-all pattern to keep the mailbox small.",
    "good_code": "def loop(state) do\n  receive do\n    {:priority_msg, data} ->\n      handle_priority(data)\n      loop(state)\n    other ->\n      handle_normal(other)\n      loop(state)\n  after 0 ->\n      # Handle idle state\n      loop(state)\n  end\nend",
    "verification": "Monitor process mailbox sizes using ':erlang.process_info(pid, :message_queue_len)' and observe scheduler utilization via observer or dashboard.",
    "date": "2026-03-30",
    "id": 1774855038,
    "type": "error"
});