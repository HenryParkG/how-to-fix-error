window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Selective Receive Stalls",
    "slug": "elixir-genserver-selective-receive-fix",
    "language": "Elixir",
    "code": "MailboxCongestion",
    "tags": [
        "Go",
        "Backend",
        "Erlang",
        "Error Fix"
    ],
    "analysis": "<p>Elixir GenServers process messages sequentially. A 'Selective Receive' stall occurs when a programmer uses a manual `receive` block inside a GenServer callback (like `handle_info` or `handle_call`) to wait for a specific message. If the GenServer's mailbox contains thousands of other unrelated messages, the Erlang VM must scan the entire mailbox linearly for every attempt to match the pattern, leading to O(N) complexity per message and effectively freezing the process.</p>",
    "root_cause": "Using manual `receive` blocks inside a GenServer, which bypasses the standard message loop and forces inefficient mailbox scanning.",
    "bad_code": "def handle_info(:get_status, state) {\n  send(self(), :query_internal)\n  receive do # Selective receive stall\n    :internal_response -> \n      {:noreply, state}\n  after\n    5000 -> {:noreply, state}\n  end\n}",
    "solution_desc": "Eliminate manual `receive` blocks. Instead, refactor the logic to use asynchronous message passing where the response is handled in its own `handle_info` callback, allowing the GenServer to remain responsive to other messages.",
    "good_code": "def handle_info(:get_status, state) {\n  send(self(), :query_internal)\n  {:noreply, state}\n}\n\n# Properly handled in the standard GenServer loop\ndef handle_info(:internal_response, state) {\n  {:noreply, state}\n}",
    "verification": "Use `:erlang.process_info(pid, :message_queue_len)` to monitor mailbox growth and ensure it remains stable under load.",
    "date": "2026-05-08",
    "id": 1778224615,
    "type": "error"
});