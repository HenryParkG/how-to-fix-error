window.onPostDataLoaded({
    "title": "Eliminating Elixir GenServer Selective Receive Bottlenecks",
    "slug": "elixir-genserver-selective-receive",
    "language": "Elixir",
    "code": "MailboxO(N)",
    "tags": [
        "Elixir",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>GenServers process messages from their mailbox sequentially. A common mistake is using an explicit <code>receive</code> block inside a <code>handle_info</code> or <code>handle_call</code> callback. This forces the Erlang VM to traverse the entire mailbox to find a matching message, bypassing the GenServer's internal optimization.</p><p>When the mailbox is large (high-throughput), this creates an O(N) scan per message, leading to severe latency spikes and potential node crashes.</p>",
    "root_cause": "Using the 'receive' keyword inside a GenServer callback, which resets the mailbox pointer and causes a linear scan for every incoming message.",
    "bad_code": "def handle_info(:process_batch, state) do\n  receive do\n    {:data, msg} -> \n      # This scans the whole mailbox!\n      handle_data(msg, state)\n  after\n    0 -> :ok\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Remove explicit 'receive' blocks. Allow the GenServer to handle messages via standard callbacks. Use a state-managed buffer or a :queue to store messages if you need to process them in batches or specific orders.",
    "good_code": "def handle_info({:data, msg}, state) {\n  new_buffer = [msg | state.buffer]\n  {:noreply, %{state | buffer: new_buffer}}\n}\n\ndef handle_info(:process_batch, state) {\n  Enum.each(state.buffer, &process/1)\n  {:noreply, %{state | buffer: []}}\n}",
    "verification": "Monitor ':erlang.process_info(pid, :message_queue_len)'. If it grows indefinitely while CPU is high, selective receive is the culprit. Fixed code will show steady throughput.",
    "date": "2026-03-11",
    "id": 1773211258,
    "type": "error"
});