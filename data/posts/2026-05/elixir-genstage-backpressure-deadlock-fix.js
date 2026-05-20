window.onPostDataLoaded({
    "title": "Fixing GenStage Backpressure Deadlocks in Elixir OTP",
    "slug": "elixir-genstage-backpressure-deadlock-fix",
    "language": "Elixir",
    "code": "GenStageDeadlock",
    "tags": [
        "Elixir",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>GenStage pipelines process event streams through a producer/consumer relationship mediated by dynamic demand-driven backpressure. Under high-throughput scenarios, a common deadlock vector emerges when producer-consumers make synchronous calls up or down the pipeline during event processing.</p><p>If a downstream consumer is blocked waiting for system resources, and a producer-consumer initiates a synchronous <code>GenServer.call/3</code> to that consumer inside its <code>handle_events/3</code> callback, the system locks. The producer-consumer cannot process incoming events, preventing demands from being fulfilled, freezing the OTP stage topology entirely.</p>",
    "root_cause": "The pipeline thread is blocked waiting on a synchronous reply from another process in the pipeline topology while holding the active GenStage execution frame, causing backpressure demand loops to block each other indefinitely.",
    "bad_code": "defmodule MyProducerConsumer do\n  use GenStage\n\n  def start_link(args), do: GenStage.start_link(__MODULE__, args)\n\n  def init(state), do: {:producer_consumer, state}\n\n  def handle_events(events, _from, state) do\n    processed = Enum.map(events, fn event ->\n      # BUG: Synchronous call blocking the pipeline. \n      # If DownstreamConsumer is full/waiting on demand, this deadlocks.\n      GenServer.call(MyDownstreamConsumer, {:process, event}, 15000)\n    end)\n    {:noreply, processed, state}\n  end\nend",
    "solution_desc": "Replace synchronous calls with fully asynchronous pipeline operations. Instead of using `GenServer.call/3`, let GenStage handle event routing automatically through consumer subscription matching or use asynchronous tasks via `Task.Supervisor` to process slow actions without blocking the consumer-producer event-loop thread.",
    "good_code": "defmodule MyProducerConsumer do\n  use GenStage\n\n  def start_link(args), do: GenStage.start_link(__MODULE__, args)\n\n  def init(state), do: {:producer_consumer, state}\n\n  # FIX: Transform events asynchronously or delegate via non-blocking operations\n  def handle_events(events, _from, state) do\n    processed = Enum.map(events, fn event ->\n      # Perform non-blocking processing locally and let GenStage downstream subscription carry events\n      process_event_async(event)\n    end)\n    {:noreply, processed, state}\n  end\n\n  defp process_event_async(event) do\n    # Modify the payload in a non-blocking fashion\n    Map.put(event, :processed, true)\n  end\nend",
    "verification": "Run a load test processing 50,000 requests/sec. Use `:observer.start` to monitor process mailboxes. Verify that the process queues of the GenStage processes remain steady at or near 0, and that events flow through the pipeline continuously without lockups.",
    "date": "2026-05-20",
    "id": 1779244125,
    "type": "error"
});