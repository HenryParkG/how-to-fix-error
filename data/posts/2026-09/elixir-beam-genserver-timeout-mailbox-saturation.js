window.onPostDataLoaded({
    "title": "Fix GenServer Call Timeouts & Mailbox Cascades",
    "slug": "elixir-beam-genserver-timeout-mailbox-saturation",
    "language": "Elixir",
    "code": "GenServer.call Timeout",
    "tags": [
        "Elixir",
        "BEAM",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In BEAM-based architectures, <code>GenServer.call/3</code> enforces a default synchronous timeout of 5,000 milliseconds. When a GenServer process encounters I/O latency, lock contention, or computational stalls, incoming synchronous messages buffer in its unbounded process mailbox. Because the BEAM process evaluates messages sequentially from the message queue, message processing time scales linearly with queue depth.</p><p>As callers exceed their 5-second deadline, they exit with a <code>:timeout</code> exit signal, often taking down caller processes and their supervisory subtrees. Crucially, the target GenServer continues processing stale, abandoned requests because the messages remain in its mailbox. This triggers a negative feedback loop: arriving callers timeout immediately, yet their requests continue to saturate the GenServer, ultimately propagating process mailbox saturation cascades across dependent supervision trees.</p>",
    "root_cause": "Synchronous, serial processing of high-latency operations inside the GenServer process loop blocks message dequeueing, causing mailbox growth, caller exit on default 5000ms timeouts, and wasted computation on orphan requests.",
    "bad_code": "defmodule CoreEngine.BillingAggregator do\n  use GenServer\n\n  def process_invoice(server, invoice_data) do\n    GenServer.call(server, {:process_invoice, invoice_data})\n  end\n\n  @impl true\n  def handle_call({:process_invoice, invoice_data}, _from, state) do\n    # Blocking external HTTP/DB request executed sequentially in GenServer process\n    result = ExternalPaymentGateway.charge(invoice_data)\n    updated_state = Map.update!(state, :processed_count, &(&1 + 1))\n    {:reply, result, updated_state}\n  end\nend",
    "solution_desc": "Decouple message consumption from heavy task execution. Use GenServer.reply/2 with asynchronous BEAM Tasks supervised by a Task.Supervisor, or delegate work to pooled worker processes using NimblePool. By returning quickly from handle_call or offloading work to a dynamically scaled worker task, the GenServer's mailbox remains empty and resilient to load surges. Additionally, incorporate deadline-awareness to discard abandoned requests before execution.",
    "good_code": "defmodule CoreEngine.BillingAggregator do\n  use GenServer\n\n  def process_invoice(server, invoice_data, timeout \\\\ 5000) do\n    deadline = System.monotonic_time(:millisecond) + timeout\n    GenServer.call(server, {:process_invoice, invoice_data, deadline}, timeout)\n  end\n\n  @impl true\n  def handle_call({:process_invoice, invoice_data, deadline}, from, state) do\n    # Check if request has already expired while waiting in mailbox\n    if System.monotonic_time(:millisecond) > deadline do\n      {:reply, {:error, :timeout_in_queue}, state}\n    else\n      # Offload execution to a supervised Task and reply asynchronously\n      Task.Supervisor.start_child(CoreEngine.TaskSupervisor, fn ->\n        result = ExternalPaymentGateway.charge(invoice_data)\n        GenServer.reply(from, result)\n      end)\n\n      {:noreply, Map.update!(state, :processed_count, &(&1 + 1))}\n    end\n  end\nend",
    "verification": "Inspect the process mailbox queue depth using `:erlang.process_info(pid, :message_queue_len)` under simulated peak concurrency with tools like Tsung or k6. Verify that queue lengths remain near zero and zero caller timeouts occur under high downstream I/O latency.",
    "date": "2026-09-05",
    "id": 1788592441,
    "type": "error"
});