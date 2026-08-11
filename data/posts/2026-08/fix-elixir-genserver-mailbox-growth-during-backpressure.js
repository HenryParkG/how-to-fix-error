window.onPostDataLoaded({
    "title": "Fix Elixir GenServer Mailbox Growth During Backpressure",
    "slug": "fix-elixir-genserver-mailbox-growth-during-backpressure",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Elixir",
        "BEAM",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When downstream dependencies slow down during traffic spikes, asynchronous messages dispatched via GenServer.cast/2 accumulate rapidly in the process mailbox. Because Erlang/Elixir mailboxes are unbounded by default, unthrottled message ingestion quickly leads to high memory overhead and eventual BEAM node failure due to Out-Of-Memory (OOM) crashes.</p>",
    "root_cause": "Asynchronous messaging without demand signaling allows upstream producers to overflow a single GenServer process's unbounded mailbox when downstream IO latency spikes.",
    "bad_code": "defmodule EventProcessor do\n  use GenServer\n\n  def push_event(pid, event) do\n    GenServer.cast(pid, {:process_event, event})\n  end\n\n  def handle_cast({:process_event, event}, state) do\n    # Blocking HTTP call inside cast causes mailbox backup\n    HTTPoison.post!(\"https://api.internal/ingest\", Jason.encode!(event))\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Replace asynchronous cast calls with a demand-driven GenStage/Flow model or use synchronous calls with bounded queues to apply backpressure back to producers.",
    "good_code": "defmodule EventConsumer do\n  use GenStage\n\n  def start_link(opts), do: GenStage.start_link(__MODULE__, opts)\n\n  def init(_opts) do\n    {:consumer, %{}, subscribe_to: [{EventProducer, max_demand: 50, min_demand: 10}]}\n  end\n\n  def handle_events(events, _from, state) do\n    Enum.each(events, fn event ->\n      Finch.build(:post, \"https://api.internal/ingest\", [], Jason.encode!(event))\n      |> Finch.request(MyFinch)\n    end)\n    {:noreply, [], state}\n  end\nend",
    "verification": "Run load tests against the service and monitor message queue depth using :erlang.process_info(pid, :message_queue_len) to ensure process mailboxes stay strictly bounded under latency injection.",
    "date": "2026-08-11",
    "id": 1786430964,
    "type": "error"
});