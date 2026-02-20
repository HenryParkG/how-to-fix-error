window.onPostDataLoaded({
    "title": "Resolving Elixir GenServer Mailbox Congestion",
    "slug": "elixir-genserver-mailbox-congestion",
    "language": "Elixir",
    "code": "Mailbox Overflow",
    "tags": [
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Elixir processes have a single mailbox. When using 'selective receive' (manual receive blocks inside a GenServer callback), the Erlang VM must scan the entire mailbox to find a matching message. If the GenServer receives a high volume of messages that do not match the selective pattern, those messages accumulate, and every subsequent scan becomes an O(N) operation, eventually leading to process crashes or extreme CPU spikes.</p>",
    "root_cause": "Implementing a manual 'receive' block inside a 'handle_info' or 'handle_call' that waits for a specific message, forcing the BEAM to traverse potentially thousands of unrelated messages already in the queue.",
    "bad_code": "def handle_info(:start_task, state) do\n  send(self(), :sub_task)\n  # BAD: Selective receive inside a GenServer callback\n  receive do\n    :sub_task -> \n      do_work()\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Never use manual 'receive' blocks inside GenServer callbacks. Instead, rely on the standard GenServer message handling loop. Use state to track the progress of multi-step operations and handle each step as a separate 'handle_info' or 'handle_cast' callback.",
    "good_code": "def handle_info(:start_task, state) do\n  send(self(), :sub_task)\n  {:noreply, %{state | status: :pending}}\nend\n\ndef handle_info(:sub_task, %{status: :pending} = state) do\n  do_work()\n  {:noreply, %{state | status: :idle}}\nend",
    "verification": "Check process mailbox size using ':erlang.process_info(pid, :message_queue_len)'. If the length grows continuously while CPU usage is high, selective receive is the likely culprit.",
    "date": "2026-02-20",
    "id": 1771580110,
    "type": "error"
});