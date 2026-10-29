window.onPostDataLoaded({
    "title": "Diagnosing GenServer Mailbox Saturation & Starvation",
    "slug": "elixir-otp-genserver-mailbox-saturation-starvation",
    "language": "Elixir",
    "code": "SystemLimitError",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Erlang/OTP and Elixir, every actor process contains a private, unbounded FIFO message mailbox. When a GenServer process encounters bottlenecks\u2014such as synchronous external API calls, unindexed Ecto queries, or CPU-intensive computations inside <code>handle_call/3</code> or <code>handle_cast/2</code>\u2014incoming messages accumulate faster than they can be drained.</p><p>A secondary anti-pattern is 'selective receive starvation'. When raw <code>receive do ... end</code> blocks inside a GenServer do not match the head of the process message queue, the BEAM runtime is forced to iterate over potentially tens of thousands of queued messages to locate a match. This O(N) traversal overhead turns message handling into an exponential performance cliff, leading to scheduler collapse and out-of-memory crashes.</p>",
    "root_cause": "The GenServer executes long-running synchronous work within message handlers while concurrently receiving unbounded messages, compounded by selective receive loops that force linear scans across a swollen BEAM mailbox.",
    "bad_code": "defmodule OrderPipeline.Worker do\n  use GenServer\n\n  # Blocking synchronous HTTP call within GenServer callback\n  def handle_cast({:process_order, order}, state) do\n    # External blocking request inside the event loop\n    {:ok, response} = HTTPoison.post(\"https://api.gateway/charge\", Jason.encode!(order))\n\n    # Dangerous selective receive inside a GenServer handler\n    receive do\n      {:ack, ^response} -> :ok\n    after\n      5000 -> :timeout\n    end\n\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Decouple synchronous processing using a supervised pool of dynamic workers (via Task.Supervisor, Broadway, or NimblePool). Never invoke raw selective `receive` inside a GenServer callback; maintain pure FIFO processing and implement backpressure with GenStage or Broadway.",
    "good_code": "defmodule OrderPipeline.Worker do\n  use GenServer\n\n  def handle_cast({:process_order, order}, state) do\n    # Offload the blocking work to an asynchronous Task\n    Task.Supervisor.start_child(OrderPipeline.TaskSupervisor, fn ->\n      case HTTPoison.post(\"https://api.gateway/charge\", Jason.encode!(order)) do\n        {:ok, %{status_code: 200}} -> \n          OrderPipeline.Dispatcher.complete(order.id)\n        error -> \n          OrderPipeline.Dispatcher.fail(order.id, error)\n      end\n    end)\n\n    {:noreply, state}\n  end\nend",
    "verification": "Run `:erlang.process_info(pid, :message_queue_len)` or use `:observer.start()` to confirm that message queues stay under safe boundaries. Under heavy synthetic load, queue length should stabilize near 0 without memory growth.",
    "date": "2026-10-29",
    "id": 1793275591,
    "type": "error"
});