window.onPostDataLoaded({
    "title": "Elixir GenStage: Fix Demand Starvation & OOM Flooding",
    "slug": "elixir-genstage-demand-starvation-mailbox-flooding",
    "language": "Elixir",
    "code": "SystemLimitError / OOM",
    "tags": [
        "Elixir",
        "GenStage",
        "Concurrency",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Elixir's GenStage specification provides a pull-based backpressure model designed to prevent fast producers from overwhelming downstream consumers. Communication operates through demand signals: consumers request an integer number of events via <code>ask/3</code> or automated demand replenishment, and producers respond inside <code>handle_demand/2</code> by dispatching at most the demanded quantity.</p><p>Demand starvation and message flooding occur when a producer bypasses this contract. If a producer receives external pushes (such as message queues or webhooks) and naively enqueues them into an unbounded Erlang process mailbox or process state while downstream demand is zero or throttled, memory consumption expands without bound. Conversely, if an intermediate <code>ProducerConsumer</code> forgets to recalculate and forward upstream demand after filtering events, upstream halts production entirely, leaving consumers permanently starved.</p>",
    "root_cause": "Improper tracking of pending downstream demand in handle_demand/2, coupled with external event ingestion directly into process memory without backpressure checks, breaking the pull-based communication contract.",
    "bad_code": "defmodule FlawedProducer do\n  use GenStage\n\n  def start_link(_), do: GenStage.start_link(__MODULE__, :ok, name: __MODULE__)\n  def init(:ok), do: {:producer, %{queue: :queue.new(), demand: 0}}\n\n  # Ingesting from external source directly pushes to state without demand check\n  def handle_info({:external_event, item}, state) do\n    # BUG: Unbounded queue growth when demand is zero leads to OOM\n    new_queue = :queue.in(item, state.queue)\n    {:noreply, [], %{state | queue: new_queue}}\n  end\n\n  def handle_demand(incoming_demand, state) do\n    # BUG: Fails to process buffered items and ignores remaining demand state\n    {:noreply, [], %{state | demand: incoming_demand}}\n  end\nend",
    "solution_desc": "Structure the producer to buffer events strictly up to an explicit threshold and actively dispatch available events upon receiving demand. Integrate :queue mechanics to satisfy pending demand immediately, and buffer only when demand is zero while applying upstream push-back.",
    "good_code": "defmodule ResilientProducer do\n  use GenStage\n\n  def start_link(_), do: GenStage.start_link(__MODULE__, :ok, name: __MODULE__)\n  def init(:ok), do: {:producer, %{queue: :queue.new(), demand: 0}}\n\n  def handle_demand(incoming_demand, state) do\n    total_demand = state.demand + incoming_demand\n    dispatch_events(total_demand, state.queue, [])\n  end\n\n  def handle_info({:external_event, item}, state) do\n    new_queue = :queue.in(item, state.queue)\n    dispatch_events(state.demand, new_queue, [])\n  end\n\n  defp dispatch_events(0, queue, events), do: {:noreply, Enum.reverse(events), %{queue: queue, demand: 0}}\n  defp dispatch_events(demand, queue, events) do\n    case :queue.out(queue) do\n      {{:value, item}, remaining_queue} ->\n        dispatch_events(demand - 1, remaining_queue, [item | events])\n      {:empty, _} ->\n        {:noreply, Enum.reverse(events), %{queue: queue, demand: demand}}\n    end\n  end\nend",
    "verification": "Execute heavy burst workloads against the pipeline and monitor `:erlang.process_info(pid, :message_queue_len)`. Ensure consumer throughput stays synchronized with demand thresholds without unbounded memory growth.",
    "date": "2026-10-06",
    "id": 1791258968,
    "type": "error"
});