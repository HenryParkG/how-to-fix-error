window.onPostDataLoaded({
    "title": "Resolving GenServer Selective Receive Latency",
    "slug": "elixir-genserver-selective-receive",
    "language": "Elixir",
    "code": "ProcessHanging",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Elixir/Erlang systems, a GenServer process may experience massive latency spikes if its mailbox grows. If a developer uses a manual 'receive' block inside a handle_call or handle_info, the BEAM VM must scan the entire mailbox from the beginning to find a matching message. For a mailbox with 100,000 messages, this scan happens for every single incoming message, resulting in O(N) complexity.</p>",
    "root_cause": "Using 'receive' inside GenServer callbacks (Selective Receive), which bypasses the GenServer's native priority queue management.",
    "bad_code": "def handle_info(:process_batch, state) do\n  receive do # This scans the whole mailbox!\n    {:data, msg} -> process(msg)\n  after 0 -> :ok\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Avoid explicit 'receive' blocks. Use the GenServer's built-in message handling to process messages one by one, or use a separate buffer (like a :queue or ETS) to manage high-volume data without blocking the mailbox.",
    "good_code": "def handle_info({:data, msg}, state) do\n  # GenServer natively pops the head of the mailbox\n  new_state = process_msg(state, msg)\n  {:noreply, new_state}\nend\n\ndef handle_info(:process_batch, state), do: {:noreply, state}",
    "verification": "Use ':erlang.process_info(pid, :message_queue_len)' to monitor growth and 'observer' to check for reductions in Reductions/Latency.",
    "date": "2026-04-13",
    "id": 1776045036,
    "type": "error"
});