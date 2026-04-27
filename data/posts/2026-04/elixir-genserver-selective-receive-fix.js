window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Selective Receive Bottlenecks",
    "slug": "elixir-genserver-selective-receive-fix",
    "language": "Elixir",
    "code": "Mailbox Scanning",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Elixir systems, GenServers can suffer from 'selective receive' performance degradation. This occurs when a process attempts to match a specific message in its mailbox using a <code>receive</code> block with a pattern that doesn't match the oldest messages. The Erlang VM must scan every message in the mailbox from the beginning, leading to O(N) complexity per operation, which eventually stalls the process as the mailbox grows.</p>",
    "root_cause": "Invoking a nested 'receive' block within a GenServer callback or using patterns that frequently skip the head of the mailbox.",
    "bad_code": "def handle_call(:process_data, _from, state) do\n  # This triggers a selective receive scan of the entire mailbox\n  receive do\n    {:data_ready, ref} -> {:reply, :ok, state}\n  after\n    5000 -> {:reply, :error, state}\n  end\nend",
    "solution_desc": "Eliminate nested receive blocks. Instead, use a unique reference (ref) to identify messages and handle them asynchronously via the GenServer's native handle_info callback, or use a separate stateful structure to track pending tasks.",
    "good_code": "def handle_call(:process_data, from, state) do\n  # Return immediately, don't block the mailbox\n  ref = make_ref()\n  {:noreply, Map.put(state, :pending, {from, ref})}\nend\n\ndef handle_info({:data_ready, ref}, %{pending: {from, ref}} = state) do\n  GenServer.reply(from, :ok)\n  {:noreply, Map.delete(state, :pending)}\nend",
    "verification": "Monitor process mailbox size using :erlang.process_info(pid, :message_queue_len) and measure reductions in CPU usage under load.",
    "date": "2026-04-27",
    "id": 1777268762,
    "type": "error"
});