window.onPostDataLoaded({
    "title": "Mitigating Elixir GenServer Selective Receive Bottlenecks",
    "slug": "elixir-genserver-mailbox-bottlenecks",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Elixir",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir, a GenServer processes messages sequentially from its mailbox. When a developer uses a manual <code>receive</code> block inside a GenServer callback (like <code>handle_info</code>), it triggers a 'selective receive'.</p><p>This causes the Erlang VM to scan the entire mailbox from the beginning to find a matching message. If the mailbox is large, this O(N) scan happens for every single message, leading to quadratic complexity and eventual process collapse under high load.</p>",
    "root_cause": "Manual 'receive' blocks within GenServer callbacks bypass the optimized GenServer loop and force a full mailbox scan.",
    "bad_code": "def handle_info(:process_batch, state) do\n  receive do\n    {:data, msg} -> \n      process(msg)\n      handle_info(:process_batch, state)\n  after 0 -> \n      {:noreply, state}\n  end\nend",
    "solution_desc": "Remove manual receive blocks. Instead, let the GenServer loop handle messages naturally and use an internal buffer (like a :queue or a List) within the process state to manage processing priority or batching.",
    "good_code": "def handle_info({:data, msg}, state) do\n  new_buffer = [msg | state.buffer]\n  {:noreply, %{state | buffer: new_buffer}}\nend\n\ndef handle_info(:process_batch, %{buffer: buffer} = state) do\n  Enum.each(buffer, &process/1)\n  {:noreply, %{state | buffer: []}}\nend",
    "verification": "Monitor process_info(pid, :message_queue_len). If it grows indefinitely while CPU spikes, selective receive is the culprit.",
    "date": "2026-05-18",
    "id": 1779071377,
    "type": "error"
});