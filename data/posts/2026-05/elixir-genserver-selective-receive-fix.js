window.onPostDataLoaded({
    "title": "Fixing Elixir Selective Receive Bottlenecks",
    "slug": "elixir-genserver-selective-receive-fix",
    "language": "Go",
    "code": "BEAM_MAILBOX_CONGESTION",
    "tags": [
        "Go",
        "Elixir",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Elixir systems, GenServers can suffer from severe latency spikes due to 'selective receive'. When a GenServer uses a manual `receive` block inside a callback (like `handle_info`), the BEAM VM scans the entire process mailbox from the oldest message to the newest to find a match.</p><p>If the mailbox contains thousands of messages that do not match the specific pattern, every subsequent message processing becomes an O(N) operation, effectively freezing the process once the mailbox grows sufficiently large.</p>",
    "root_cause": "Manual 'receive' blocks within GenServer callbacks that fail to match the head of the process mailbox, causing repeated full-queue scans.",
    "bad_code": "def handle_info(:process, state) do\n  receive do\n    {:specific_msg, data} -> \n      do_work(data)\n  after\n    1000 -> :timeout\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Avoid manual 'receive' inside GenServers. Instead, model all incoming messages as standard 'handle_info' patterns. This ensures the BEAM mailbox pointer advances linearly and matches the 'next' message immediately.",
    "good_code": "def handle_info({:specific_msg, data}, state) do\n  do_work(data)\n  {:noreply, state}\nend\n\ndef handle_info(_, state), do: {:noreply, state}",
    "verification": "Monitor process mailbox size using ':erlang.process_info(pid, :message_queue_len)' during load tests.",
    "date": "2026-05-05",
    "id": 1777959269,
    "type": "error"
});