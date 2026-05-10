window.onPostDataLoaded({
    "title": "Resolving Elixir GenStage Mailbox Overflows",
    "slug": "elixir-genstage-mailbox-overflows",
    "language": "Elixir",
    "code": "MailboxFull",
    "tags": [
        "Go",
        "Backend",
        "Erlang",
        "Error Fix"
    ],
    "analysis": "<p>In distributed GenStage pipelines, processes communicate via asynchronous messaging. If a Producer stage ignores the consumer's demand or if a Consumer performs blocking I/O without sufficient concurrency, the BEAM process mailbox can grow indefinitely. Unlike GenStage's internal buffering, the process mailbox has no backpressure, leading to OOM (Out of Memory) kills.</p>",
    "root_cause": "The Producer sends events using Process.send/2 instead of following the demand-driven protocol, or the Consumer fails to regulate demand, leading to message accumulation in the process queue.",
    "bad_code": "def handle_demand(demand, state) do\n  # Incorrectly ignoring demand and sending everything\n  events = fetch_all_from_db()\n  {:noreply, events, state}\nend",
    "solution_desc": "Strictly adhere to the demand parameter in <code>handle_demand/2</code>. Use <code>max_demand</code> and <code>min_demand</code> in the subscription options to prevent the consumer from being overwhelmed.",
    "good_code": "def handle_demand(demand, state) do\n  {events, next_state} = fetch_limited_from_db(demand, state)\n  {:noreply, events, next_state}\nend\n\n# In consumer initialization\nGenStage.async_subscribe(self(), to: MyProducer, max_demand: 100, min_demand: 50)",
    "verification": "Use :observer.start() or Process.info(pid, :message_queue_len) to verify that the mailbox length stays near zero during peak load.",
    "date": "2026-05-10",
    "id": 1778378437,
    "type": "error"
});