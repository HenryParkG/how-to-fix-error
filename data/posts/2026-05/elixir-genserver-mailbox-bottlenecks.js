window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Selective Receive Issues",
    "slug": "elixir-genserver-mailbox-bottlenecks",
    "language": "Java",
    "code": "MAILBOX_OVERFLOW",
    "tags": [
        "Java",
        "Elixir",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir, a GenServer's performance can degrade significantly if it uses selective receive inside its loop. When a process receives a message, Erlang scans the mailbox for a match. If the 'receive' block doesn't match the oldest messages, those messages stay in the mailbox. Subsequent receives must scan past these 'stale' messages, leading to O(N) complexity for every message processed under high load.</p>",
    "root_cause": "Selective receive causes the BEAM VM to scan the entire process mailbox repeatedly when the first message doesn't match the pattern, creating a performance bottleneck known as backpressure failure.",
    "bad_code": "def handle_info(:process, state) {\n  receive do\n    {:specific_msg, data} -> \n      # This is dangerous inside a GenServer!\n      process_data(data)\n  after 0 -> \n    :ok\n  end\n  {:noreply, state}\n}",
    "solution_desc": "Never use the 'receive' keyword inside a GenServer callback. GenServers are already built on top of a receive loop. Instead, use 'handle_info' to match messages at the top level of the mailbox. This ensures each message is handled or discarded in O(1) time without scanning.",
    "good_code": "def handle_info({:specific_msg, data}, state) do\n  process_data(data)\n  {:noreply, state}\nend\n\ndef handle_info(_unexpected, state) do\n  # Always catch-all to prevent mailbox bloat\n  {:noreply, state}\nend",
    "verification": "Monitor process mailbox size using :erlang.process_info(pid, :message_queue_len) under load.",
    "date": "2026-05-16",
    "id": 1778897051,
    "type": "error"
});