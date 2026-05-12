window.onPostDataLoaded({
    "title": "Solving Selective Receive Bottlenecks in Elixir",
    "slug": "elixir-selective-receive-bottleneck",
    "language": "Elixir / Erlang",
    "code": "BEAM_MAILBOX_STALL",
    "tags": [
        "Go",
        "Node.js",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang VM (BEAM), 'selective receive' occurs when a process scans its mailbox for a specific pattern, skipping other messages. In a high-throughput GenServer, if the mailbox grows to thousands of messages and the process frequently looks for a specific tag that is not at the head of the queue, the complexity of message retrieval becomes O(N). This causes the GenServer to spend more time scanning the mailbox than processing logic, leading to total process exhaustion.</p>",
    "root_cause": "Manually calling 'receive' inside a GenServer callback for a specific pattern while other messages (like 'handle_info' calls) accumulate.",
    "bad_code": "def handle_cast({:process, data}, state) {\n  # Manual receive inside a callback\n  receive do\n    {:external_priority, val} -> \n      do_work(data, val)\n  after 1000 -> \n      do_work(data, :default)\n  end\n  {:noreply, state}\n}",
    "solution_desc": "Avoid manual 'receive' blocks within GenServers. Use 'handle_info' to process all incoming messages asynchronously and manage internal state machines to handle 'wait' conditions without blocking the mailbox scan.",
    "good_code": "def handle_cast({:process, data}, state) {\n  # Store the task and wait for the info message\n  {:noreply, %{state | pending: data}}\n}\n\ndef handle_info({:external_priority, val}, state) {\n  # Standard message loop processing\n  do_work(state.pending, val)\n  {:noreply, %{state | pending: nil}}\n}",
    "verification": "Use :erlang.process_info(pid, :message_queue_len) to detect linear growth during peak load.",
    "date": "2026-05-12",
    "id": 1778551600,
    "type": "error"
});