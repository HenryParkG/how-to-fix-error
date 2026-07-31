window.onPostDataLoaded({
    "title": "Fix BEAM Scheduler Reduction Starvation in Elixir",
    "slug": "fix-beam-scheduler-reduction-starvation-elixir",
    "language": "Elixir",
    "code": "SchedulerStarvation",
    "tags": [
        "Elixir",
        "BEAM",
        "Concurrency",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>The Erlang BEAM VM schedules processes using reductions (where 1 reduction roughly equals 1 function call, limited to 4000 reductions per time slice). When an Elixir process receives messages into an unbounded mailbox and performs selective receives, BEAM must scan every message in the queue sequentially to match patterns.</p><p>When mailbox depth exceeds tens of thousands of messages, selective receive pattern matching consumes excessive time without consuming reductions proportionally during traversal, causing scheduler preemption stalls, high latency spikes, and CPU starvation for co-located processes on the same scheduler thread.</p>",
    "root_cause": "Selective receive pattern matching traversing deeply stacked unmatched messages in an unbounded process mailbox, preventing prompt yielding and leading to reduction imbalance and high garbage collection overhead.",
    "bad_code": "defmodule UnboundedWorker do\n  use GenServer\n\n  # BUG: Selective receive inside process loop scans entire mailbox!\n  def handle_cast({:process_priority, payload}, state) do\n    receive do\n      {:urgent, urgent_msg} ->\n        process_urgent(urgent_msg)\n    after\n      0 ->\n        process_payload(payload)\n    end\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Remove selective receive statements inside GenServer loops. Implement catch-all pattern matching for incoming messages and manage priority inside a stateful priority queue struct (like :queue or a custom heap) to keep message mailboxes shallow and deterministic.",
    "good_code": "defmodule BoundedWorker do\n  use GenServer\n  require Logger\n\n  @max_queue_size 10_000\n\n  def init(_opts) do\n    {:ok, %{queue: :queue.new(), count: 0}}\n  end\n\n  # Catch-all sequential message receiving (prevents selective receive scanning)\n  def handle_info({:urgent, urgent_msg}, state) do\n    process_urgent(urgent_msg)\n    {:noreply, state}\n  end\n\n  def handle_info({:standard, payload}, %{count: count} = state) when count < @max_queue_size do\n    new_queue = :queue.in(payload, state.queue)\n    {:noreply, %{state | queue: new_queue, count: count + 1}}\n  end\n\n  def handle_info({:standard, _payload}, state) do\n    Logger.warning(\"Mailbox/Queue capacity reached. Dropping payload.\")\n    {:noreply, state}\n  end\n\n  defp process_urgent(msg), do: msg\nend",
    "verification": "Inspect process metrics using ':erlang.process_info(pid, :message_queue_len)' and observe uniform reduction distribution across schedulers with ':observer.start()'.",
    "date": "2026-07-31",
    "id": 1785496891,
    "type": "error"
});