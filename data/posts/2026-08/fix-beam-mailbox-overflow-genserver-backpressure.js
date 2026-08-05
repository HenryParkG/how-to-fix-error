window.onPostDataLoaded({
    "title": "Fixing BEAM Mailbox Overflow in Elixir GenServers",
    "slug": "fix-beam-mailbox-overflow-genserver-backpressure",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Elixir",
        "BEAM",
        "Erlang",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In the BEAM virtual machine, actor processes receive messages into an unbounded process mailbox. When a single GenServer instance becomes a bottleneck receiving casts or calls faster than its single-threaded loop can process them, the mailbox grows uncontrollably, consuming memory and increasing garbage collection overhead.</p><p>Because BEAM process mailboxes perform linear scans during selective receive operations, large mailboxes severely degrade performance, triggering cascading system-wide timeouts and OOM (Out Of Memory) process termination.</p>",
    "root_cause": "Unbounded message queuing via GenServer.cast/2 without producer rate-limiting or backpressure mechanisms, resulting in unbounded BEAM process mailbox growth under heavy throughput.",
    "bad_code": "# Buggy: Asynchronous cast without backpressure under high volume\ndef handle_cast({:process_event, data}, state) do\n  # Expensive computation blocking the GenServer loop\n  result = HeavyProcessor.compute(data)\n  {:noreply, update_state(state, result)}\nend",
    "solution_desc": "Implement backpressure using GenStage, Broadway, or bounded job queues. Replace unbounded casts with synchronous calls (GenServer.call/3) or offload execution to a dynamic process pool (such as Task.Supervisor) to bound mailbox size.",
    "good_code": "# Fixed: Offloading work to Task pool & enforcing bounded execution\ndef handle_call({:process_event, data}, _from, state) do\n  task = Task.Supervisor.async_nolink(MyApp.TaskSupervisor, fn ->\n    HeavyProcessor.compute(data)\n  end)\n  {:reply, {:ok, task.ref}, state}\nend",
    "verification": "Monitor process mailbox length using :observer.start() or telemetry telemetry: [:process, :message_queue_len]. Run benchmark load tests and assert mailbox length stays bounded under 1000 messages.",
    "date": "2026-08-05",
    "id": 1785894231,
    "type": "error"
});