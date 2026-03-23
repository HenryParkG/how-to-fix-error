window.onPostDataLoaded({
    "title": "Elixir: Fixing Selective Receive Bottlenecks in OTP",
    "slug": "elixir-selective-receive-bottlenecks-otp",
    "language": "Elixir",
    "code": "O(N) Mailbox Scan",
    "tags": [
        "Go",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir's actor model, a process mailbox is a linked list. When using a selective <code>receive</code> block with a specific pattern (like a reference), the Erlang VM must scan every message from the head of the queue until it finds a match. If the mailbox grows to thousands of messages and the matching message is near the end, CPU usage spikes as the VM traverses the list repeatedly for every new attempt.</p>",
    "root_cause": "The BEAM virtual machine traverses the entire process mailbox linearly to find a match for selective patterns, turning message retrieval into an O(N) operation where N is the mailbox length.",
    "bad_code": "def loop(state) do\n  receive do\n    {:specific_tag, ^some_ref, msg} -> \n      handle_msg(msg, state)\n  end\n  loop(state)\nend",
    "solution_desc": "Avoid selective receive in high-throughput processes. Use a GenServer to consume all messages indiscriminately and manage internal state or use a priority queue structure. If you must use refs, ensure the mailbox is kept small by offloading work to task workers.",
    "good_code": "def handle_info({:specific_tag, ref, msg}, state) do\n  # GenServer handles the head of the queue automatically\n  new_state = process_data(msg, state)\n  {:noreply, new_state}\nend\n\ndef handle_info(_unexpected, state), do: {:noreply, state}",
    "verification": "Monitor :erlang.process_info(pid, :message_queue_len) and check for high 'reductions' in observer to identify CPU-bound processes.",
    "date": "2026-03-23",
    "id": 1774259718,
    "type": "error"
});