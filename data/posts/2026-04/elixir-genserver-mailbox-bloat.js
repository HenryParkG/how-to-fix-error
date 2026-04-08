window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Selective Receive Mailbox Bloat",
    "slug": "elixir-genserver-mailbox-bloat",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Elixir",
        "Erlang",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir, a GenServer runs within a single process that relies on a specific message handling loop. Selective receive occurs when a developer uses a manual <code>receive</code> block inside a GenServer callback (like <code>handle_info/2</code> or <code>handle_cast/2</code>). This causes the process to scan its own mailbox for a specific pattern, skipping other messages. As the mailbox grows, each scan becomes O(N), leading to severe CPU spikes and eventual process crashes due to memory exhaustion.</p>",
    "root_cause": "The use of a nested 'receive' block inside a GenServer callback, which bypasses the standard OTP loop and forces linear scanning of the process mailbox.",
    "bad_code": "def handle_info(:trigger_sync, state) do\n  send(self(), :inner_msg)\n  # BAD: Manual receive inside a GenServer callback\n  receive do\n    :inner_msg -> \n      perform_sync(state)\n  after\n    5000 -> :timeout\n  end\n  {:noreply, state}\nend",
    "solution_desc": "Refactor the logic to use the GenServer's native state machine. Instead of waiting manually, return the state and handle the subsequent message in a separate 'handle_info' or 'handle_cast' callback to keep the mailbox flowing.",
    "good_code": "def handle_info(:trigger_sync, state) do\n  send(self(), :inner_msg)\n  {:noreply, state}\nend\n\n@impl true\ndef handle_info(:inner_msg, state) do\n  perform_sync(state)\n  {:noreply, state}\nend",
    "verification": "Use ':erlang.process_info(pid, :message_queue_len)' to monitor mailbox growth under load.",
    "date": "2026-04-08",
    "id": 1775611641,
    "type": "error"
});