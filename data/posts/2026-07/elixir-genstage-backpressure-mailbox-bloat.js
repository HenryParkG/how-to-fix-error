window.onPostDataLoaded({
    "title": "Fixing Elixir GenStage Backpressure Mailbox Bloat",
    "slug": "elixir-genstage-backpressure-mailbox-bloat",
    "language": "Elixir / Erlang",
    "code": "GENSTAGE_BLOAT",
    "tags": [
        "Go",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir, GenStage provides a specification to exchange events between producers and consumers with backpressure. However, a major failure mode occurs when producers receive out-of-band asynchronous messages (e.g., from network sockets or GenServer calls) and immediately cast them down the pipeline or directly to themselves without matching consumer demand. When consumer execution slows down, these messages queue up in the producer's standard Erlang process mailbox rather than being constrained by the backpressure mechanism, leading to uncontrolled memory consumption (mailbox bloat) and an eventual VM crash due to OOM.</p>",
    "root_cause": "The producer process fails to buffer incoming messages in internal state queues when downstream demand is low, allowing incoming asynchronous messages to stack up infinitely in the Erlang process mailbox.",
    "bad_code": "defmodule BadProducer do\n  use GenStage\n\n  def start_link(_opts), do: GenStage.start_link(__MODULE__, :ok)\n  def init(:ok), do: {:producer, :ok}\n\n  # Bug: Direct dispatching inside handle_info bypassing demand control\n  def handle_info({:incoming_event, event}, state) do\n    {:noreply, [event], state}\n  end\n\n  def handle_demand(_demand, state) do\n    {:noreply, [], state}\n  end\nend",
    "solution_desc": "Refactor the producer to manage its own internal buffer (for example, using the Erlang :queue module). Store incoming events in this buffer when they arrive asynchronously, and only dequeue and emit them when the consumers signal demand via 'handle_demand/2'.",
    "good_code": "defmodule GoodProducer do\n  use GenStage\n\n  def start_link(_opts), do: GenStage.start_link(__MODULE__, :ok)\n\n  def init(:ok) do\n    {:producer, %{queue: :queue.new(), demand: 0}}\n  end\n\n  def handle_info({:incoming_event, event}, state) do\n    new_queue = :queue.in(event, state.queue)\n    dispatch_events(new_queue, state.demand)\n  end\n\n  def handle_demand(incoming_demand, state) do\n    total_demand = state.demand + incoming_demand\n    dispatch_events(state.queue, total_demand)\n  end\n\n  defp dispatch_events(queue, demand) do\n    {events, remaining_queue, remaining_demand} = take_events(queue, demand, [])\n    {:noreply, events, %{queue: remaining_queue, demand: remaining_demand}}\n  end\n\n  defp take_events(queue, 0, acc), do: {Enum.reverse(acc), queue, 0}\n  defp take_events(queue, demand, acc) do\n    case :queue.out(queue) do\n      {{:value, val}, rest} -> take_events(rest, demand - 1, [val | acc])\n      {:empty, empty_q} -> {Enum.reverse(acc), empty_q, demand}\n    end\n  end\nend",
    "verification": "Load test the pipeline and monitor the mailbox queue size by running ':erlang.process_info(pid, :message_queue_len)' in iex. The message queue length should stay close to 0 even when consumers are artificially stalled.",
    "date": "2026-07-05",
    "id": 1783217226,
    "type": "error"
});