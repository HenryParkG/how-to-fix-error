window.onPostDataLoaded({
    "title": "Eliminating Elixir GenServer Mailbox Bottlenecks",
    "slug": "elixir-genserver-mailbox-optimization",
    "language": "Go",
    "code": "MailboxSelectiveReceive",
    "tags": [
        "Go",
        "Backend",
        "Elixir",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir/Erlang, a GenServer processes messages sequentially from its mailbox. A common performance trap is 'selective receive' within a loop or calling <code>receive</code> manually inside a GenServer callback. If the process receives many messages that don't match the specific pattern being sought, the Erlang VM must scan the entire mailbox repeatedly. This O(N) operation turns into O(N^2) complexity as the mailbox grows, eventually causing the process to hang and time out.</p>",
    "root_cause": "Using a manual 'receive' block inside a handle_info or handle_cast that looks for a specific reference while thousands of unrelated messages sit in the mailbox.",
    "bad_code": "def handle_info(:process_batch, state) do\n  # BAD: Manual selective receive scans the whole mailbox\n  receive do\n    {:specific_event, data} -> \n      process_data(data)\n  after 0 -> \n      :ok\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Always allow the GenServer to handle messages via standard callbacks. Use an internal queue or a state machine to manage processing logic rather than trying to 'pick' messages out of the mailbox order.",
    "good_code": "def handle_info({:specific_event, data}, state) do\n  # GOOD: Let GenServer naturally pop from the top of the mailbox\n  new_state = process_data(state, data)\n  {:noreply, new_state}\nend\n\ndef handle_info(:process_batch, state) do\n  # Logic moved to state management\n  {:noreply, state}\nend",
    "verification": "Use :erlang.process_info(pid, :message_queue_len) to monitor mailbox growth. Performance should remain constant regardless of mailbox size.",
    "date": "2026-03-03",
    "id": 1772530404,
    "type": "error"
});