window.onPostDataLoaded({
    "title": "Elixir GenServer Mailbox Saturation & Selective Receive Latency",
    "slug": "elixir-genserver-mailbox-saturation-selective-receive-latency",
    "language": "Elixir",
    "code": "MailboxSaturation",
    "tags": [
        "Elixir",
        "OTP",
        "GenServer",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir (and Erlang/OTP), GenServers communicate via message passing, where messages are placed in a process's mailbox. When a GenServer receives messages faster than it can process them, its mailbox can grow indefinitely, leading to 'mailbox saturation'. This consumes memory, can cause the process to crash (due to out-of-memory), and introduces increasing latency for messages already in the queue.</p><p>A related trap is 'selective receive latency'. Erlang's `receive` construct allows pattern matching on messages. If a GenServer expects a specific message pattern and its mailbox contains many other non-matching messages before the desired one, the `receive` loop must iterate through all preceding messages. This linear scan adds latency, even if the mailbox isn't strictly 'saturated' but contains a high volume of irrelevant messages that need to be skipped, making the GenServer appear unresponsive.</p>",
    "root_cause": "High message throughput to a single GenServer, slow message processing logic within the GenServer, or inappropriate message patterns that force the GenServer to scan large mailboxes.",
    "bad_code": "def handle_call(:process_expensive, _from, state) do\n  # Imagine this operation takes 500ms and is called frequently\n  :timer.sleep(500)\n  {:reply, :done, state}\nend\n\ndef handle_cast(:log_event, state) do\n  # Many log messages queueing up before handle_call\n  IO.inspect(\"Logging event...\")\n  {:noreply, state}\nend",
    "solution_desc": "To combat mailbox saturation, optimize the GenServer's processing logic, distribute the workload across multiple GenServers (e.g., using a pool or dynamic supervisors), or implement backpressure mechanisms. For selective receive latency, ensure messages are processed in a predictable order and that the GenServer is not forced to scan large numbers of irrelevant messages. Consider using a common 'tag' for messages that need immediate attention or refactor to avoid mixed message types if processing order isn't strict. For critical operations, dedicated GenServers or different message dispatch strategies (like `:erlang.send_after` with unique message IDs) might be necessary. Implement monitoring for mailbox size (e.g., via `Process.info(pid, :message_queue_len)`).",
    "good_code": "defmodule MyApp.Worker do\n  use GenServer\n  # ... initialization ...\n\n  # Distribute heavy work to an async task or another process\n  def handle_call(:process_expensive, _from, state) do\n    # Spawn a task to do the heavy lifting, reply immediately\n    Task.start(fn -> MyApp.HeavyWorker.process_data(state.data) end)\n    {:reply, :ack, state}\n  end\n\n  # If logging is critical, send to a dedicated logging GenServer\n  def handle_cast(:log_event, state) do\n    Logger.info(\"Logging event...\") # Use Elixir's Logger, which often queues to a separate process\n    {:noreply, state}\n  end\nend\n\n# Or implement backpressure via a Task.Supervisor/Broadway/Oban",
    "verification": "Monitor `Process.info(pid, :message_queue_len)` for critical GenServers to ensure mailboxes don't grow unbounded. Observe application latency metrics. If individual `handle_call` or `handle_cast` functions take too long, consider profiling with `:fprof` or `Paren.exe`. Ensure `receive` blocks are not scanning excessive messages by reviewing `handle_info` and `handle_call` implementations for proper message pattern matching and processing efficiency.",
    "date": "2026-08-20",
    "id": 1787186439,
    "type": "error"
});