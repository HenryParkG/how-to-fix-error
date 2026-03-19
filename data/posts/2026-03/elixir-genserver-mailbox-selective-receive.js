window.onPostDataLoaded({
    "title": "Eliminating Elixir GenServer Mailbox Bloat",
    "slug": "elixir-genserver-mailbox-selective-receive",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Backend",
        "Erlang",
        "Error Fix"
    ],
    "analysis": "<p>GenServer mailbox bloat occurs when a process receives messages faster than it can process them, or when 'selective receive' logic is misused. In Erlang/Elixir, if a process uses a manual 'receive' block that doesn't match the oldest messages in the mailbox, the VM must scan the entire mailbox repeatedly to find a match. This O(N) operation becomes increasingly expensive as the mailbox grows, eventually consuming all system memory.</p>",
    "root_cause": "Misuse of selective receive patterns or failing to provide a catch-all 'handle_info' callback, causing unhandled messages to accumulate indefinitely in the process mailbox.",
    "bad_code": "def handle_info(:specific_msg, state) do\n  # Only handles :specific_msg\n  {:noreply, state}\nend\n# Any other message stays in the mailbox forever.",
    "solution_desc": "Always implement a catch-all 'handle_info/2' clause to discard or log unexpected messages. For high-throughput scenarios, offload heavy processing to Task workers or use a producer-consumer pattern (GenStage) to provide backpressure.",
    "good_code": "def handle_info(:specific_msg, state) do\n  {:noreply, state}\nend\n\ndef handle_info(msg, state) do\n  Logger.warning(\"Unhandled message: #{inspect(msg)}\")\n  {:noreply, state} # Clears mailbox\nend",
    "verification": "Check process mailbox size using ':erlang.process_info(pid, :message_queue_len)'. Use the Observer tool to monitor process memory growth over time.",
    "date": "2026-03-19",
    "id": 1773895807,
    "type": "error"
});