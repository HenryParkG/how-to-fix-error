window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Selective Receive Bloat",
    "slug": "fixing-elixir-genserver-selective-receive-bloat",
    "language": "Elixir",
    "code": "MailboxBloat",
    "tags": [
        "Elixir",
        "BEAM",
        "Concurrency",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput BEAM streaming pipelines, executing explicit selective <code>receive</code> blocks inside a GenServer callback disrupts standard message queue handling. Unmatched incoming stream messages accumulate in the process mailbox, forcing every subsequent message to perform an O(N) linear scan over thousands of unhandled messages, driving CPU usage to 100% and causing OOM panics.</p>",
    "root_cause": "Nested `receive` statements block the primary GenServer message processing loop, accumulating unmatched messages in the BEAM process mailbox.",
    "bad_code": "defmodule StreamWorker do\n  use GenServer\n\n  def handle_info({:data, id, payload}, state) do\n    # ANTI-PATTERN: Selective receive inside GenServer loop\n    receive do\n      {:ack, ^id} -> {:noreply, process_payload(payload, state)}\n    after\n      1000 -> {:noreply, state}\n    end\n  end\nend",
    "solution_desc": "Eliminate explicit nested `receive` blocks. Store unacknowledged payload states inside the GenServer state Map and handle `:ack` messages asynchronously via standard `handle_info/2` callbacks.",
    "good_code": "defmodule StreamWorker do\n  use GenServer\n\n  def handle_info({:data, id, payload}, state) do\n    new_pending = Map.put(state.pending, id, payload)\n    {:noreply, %{state | pending: new_pending}}\n  end\n\n  def handle_info({:ack, id}, state) do\n    {payload, new_pending} = Map.pop(state.pending, id)\n    if payload, do: process_payload(payload, state)\n    {:noreply, %{state | pending: new_pending}}\n  end\nend",
    "verification": "Inspect mailbox queue size under load using `:erlang.process_info(pid, :message_queue_len)` to verify mailbox size stays close to zero.",
    "date": "2026-07-26",
    "id": 1785045081,
    "type": "error"
});