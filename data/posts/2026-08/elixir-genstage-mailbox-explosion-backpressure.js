window.onPostDataLoaded({
    "title": "Fixing Elixir GenStage Mailbox Explosions in Backpressure",
    "slug": "elixir-genstage-mailbox-explosion-backpressure",
    "language": "Elixir / BEAM",
    "code": "MailboxOverflow",
    "tags": [
        "Elixir",
        "GenStage",
        "BEAM",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Elixir's <code>GenStage</code> architecture provides a framework for exchanging events between BEAM processes using explicit backpressure demand. Consumers request events from producers, ensuring processes are never overwhelmed with high-volume stream data.</p><p>However, cascading mailbox explosions occur when producer or consumer-producer modules execute out-of-band asynchronous processing or misuse standard Elixir messages (e.g., <code>send/2</code> or standard <code>GenServer.cast/2</code>) instead of routing events exclusively through GenStage demand cycles. When downstream consumers slow down, upstream stages buffer events unbounded in their BEAM process mailboxes, eventually triggering Out-Of-Memory (OOM) crashes across the cluster.</p>",
    "root_cause": "Out-of-band message processing occurs when upstream stages push events without waiting for downstream `ask` demand, or when consumer stages return unmanaged `:noreply` states while initiating long asynchronous work, breaking the single-producer to single-consumer backpressure contract.",
    "bad_code": "defmodule BuggyProducerConsumer do\n  use GenStage\n\n  def init(state) {\n    {:producer_consumer, state}\n  }\n\n  # BUG: Sending out-of-band messages to self or downstream directly\n  def handle_events(events, _from, state) do\n    Enum.each(events, fn event ->\n      # Bypasses GenStage demand management!\n      send(state.downstream_pid, {:out_of_band_data, event})\n    end)\n    \n    {:noreply, [], state}\n  end\nend",
    "solution_desc": "Refactor stage modules to adhere strictly to GenStage demand flow protocols. Emit events solely via the return tuple `{:noreply, [events], state}` inside `handle_events/3` and `handle_demand/2`. Set appropriate `min_demand` and `max_demand` settings, and utilize `ConsumerSupervisor` for isolated asynchronous processing without compromising process mailboxes.",
    "good_code": "defmodule FixedConsumerProducer do\n  use GenStage\n\n  def start_link(opts) do\n    GenStage.start_link(__MODULE__, opts)\n  end\n\n  def init(state) do\n    {:producer_consumer, state, \n      subscribe_to: [{state.producer, min_demand: 10, max_demand: 50}]}\n  end\n\n  # CORRECT: Collect and transform events synchronously during handle_events\n  # Demand lifecycle remains strictly managed by GenStage\n  def handle_events(events, _from, state) do\n    processed_events = Enum.map(events, &process_event/1)\n    {:noreply, processed_events, state}\n  end\n\n  defp process_event(event) do\n    # Pure linear processing\n    Map.put(event, :processed, true)\n  end\nend",
    "verification": "Monitor process message queues under peak load using `:observer.start()` or Telemetry metrics: `Process.info(pid, :message_queue_len)`. The process mailbox length must remain near zero while events buffer gracefully within GenStage demand queues.",
    "date": "2026-08-07",
    "id": 1786078097,
    "type": "error"
});