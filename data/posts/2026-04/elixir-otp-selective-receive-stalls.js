window.onPostDataLoaded({
    "title": "Resolving Elixir OTP Mailbox Bloat from Selective Receive",
    "slug": "elixir-otp-selective-receive-stalls",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Elixir",
        "Backend",
        "Erlang",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir's GenServer and OTP processes, mailbox bloat occurs when the process cannot process incoming messages as fast as they arrive. However, a more insidious performance degradation happens due to 'Selective Receive'. When a process uses a <code>receive</code> block with a specific pattern that doesn't match the message at the head of the mailbox, the Erlang VM must scan the entire mailbox to find a match. This transforms message processing from O(1) to O(N), where N is the number of messages, leading to CPU spikes and eventual process crashes.</p>",
    "root_cause": "Selective receive scanning occurs when a process looks for a specific reference or tag (common in synchronous calls) while a backlog of unrelated messages sits at the front of the queue, forcing the VM to traverse the entire list for every iteration.",
    "bad_code": "def handle_info(:work, state) do\n  # This triggers selective receive if many other messages exist\n  receive do\n    {:specific_response, ^ref} -> :ok\n  after\n    5000 -> :timeout\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Refactor the process to use the standard GenServer `handle_info/2` callbacks. Instead of blocking the process with a manual `receive` block, store the request context (like a reference) in the process state and handle the response asynchronously when it arrives naturally at the head of the mailbox.",
    "good_code": "def handle_info(:work, state) do\n  ref = make_ref()\n  # Send async request elsewhere...\n  {:noreply, assign(state, :pending_ref, ref)}\nend\n\n@impl true\ndef handle_info({:specific_response, ref}, %{pending_ref: ref} = state) do\n  # Match happens at the head of the mailbox via standard callback\n  {:noreply, state}\nend",
    "verification": "Monitor process mailbox size using `:erlang.process_info(pid, :message_queue_len)` and check CPU usage with `:observer` to ensure O(1) message dispatch.",
    "date": "2026-04-09",
    "id": 1775718822,
    "type": "error"
});