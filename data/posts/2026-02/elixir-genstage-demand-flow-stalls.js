window.onPostDataLoaded({
    "title": "Mitigating Elixir GenStage Demand-Flow Stalls",
    "slug": "elixir-genstage-demand-flow-stalls",
    "language": "Go",
    "code": "STALL_BACKPRESSURE",
    "tags": [
        "Go",
        "Node.js",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>GenStage is the backbone of Elixir's data processing, but it is susceptible to 'Demand Stalls'. This happens when a Consumer fails to ask for more events, or a Producer-Consumer buffer fills up without triggering a new demand signal. In high-pressure event streams, if a single stage blocks on a synchronous I/O call without wrapping it in a task or utilizing asynchronous callbacks, the entire pipeline grinds to a halt because the backpressure mechanism assumes the consumer is busy.</p>",
    "root_cause": "A deadlock or silent failure in the `handle_demand/2` or `handle_events/3` callbacks where the cumulative demand (max_demand) is reached but no new events are emitted or acknowledged.",
    "bad_code": "def handle_events(events, _from, state) do\n  # Blocking synchronous HTTP call in the main stage process\n  # This prevents the stage from receiving more demand signals\n  Enum.each(events, fn e -> HTTPoison.post!(@url, e.body) end)\n  {:noreply, [], state}\nend",
    "solution_desc": "Decouple processing from the stage lifecycle using `Task.async_stream` or by implementing a buffering Producer-Consumer that can track 'pending demand' explicitly, ensuring that the process mailbox is never blocked by long-running side effects.",
    "good_code": "def handle_events(events, _from, state) do\n  # Process events asynchronously to keep the stage responsive\n  Task.async_stream(events, fn e -> process_event(e) end, max_concurrency: 10)\n  |> Stream.run()\n  \n  # Explicitly return no events but maintain readiness\n  {:noreply, [], state}\nend",
    "verification": "Use `:sys.get_status/1` on the stage process to inspect the 'demand' field and ensure it is non-zero during processing.",
    "date": "2026-02-27",
    "id": 1772184797,
    "type": "error"
});