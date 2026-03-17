window.onPostDataLoaded({
    "title": "Fixing Elixir OTP Selective Receive Latency",
    "slug": "elixir-otp-selective-receive-latency",
    "language": "Elixir",
    "code": "Latency Spike",
    "tags": [
        "Go",
        "Backend",
        "Elixir",
        "Error Fix"
    ],
    "analysis": "<p>Selective receive occurs when an Elixir/Erlang process searches its mailbox for a message matching a specific pattern while skipping others. In high-throughput GenServers, if the mailbox grows large (thousands of messages) and the code frequently looks for a specific 'priority' message or a late-arriving response, the BEAM VM must scan the entire mailbox O(N) for every attempt.</p><p>This causes CPU spikes and dramatic latency increases because the process remains busy traversing memory instead of processing logic.</p>",
    "root_cause": "The process mailbox contains a large number of messages that do not match the current 'receive' block patterns, forcing the VM to scan the entire queue repeatedly.",
    "bad_code": "def handle_info(:process_data, state) do\n  # This triggers a selective receive scan if other messages are in mailbox\n  receive do\n    {:priority_signal, msg} -> \n      execute_priority(msg)\n  after 0 ->\n      execute_normal()\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Eliminate manual 'receive' blocks inside GenServer callbacks. Use a dedicated state-based queue (like the 'priority_queue' library) or handle all messages via handle_info and buffer them in the process state to maintain O(1) access.",
    "good_code": "def handle_info({:priority_signal, msg}, state) do\n  # Handle immediately or push to a state-managed buffer\n  new_state = process_priority(msg, state)\n  {:noreply, new_state}\nend\n\ndef handle_info(:process_data, state) do\n  # Logic no longer scans mailbox manually\n  {:noreply, execute_normal(state)}\nend",
    "verification": "Monitor process_info(pid, :message_queue_len) and observe if reductions in 'reductions' count correlate with mailbox size.",
    "date": "2026-03-17",
    "id": 1773740767,
    "type": "error"
});