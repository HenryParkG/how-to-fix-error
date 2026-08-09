window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Exhaustion Under Load",
    "slug": "fixing-elixir-genserver-mailbox-exhaustion-backpressure",
    "language": "Elixir",
    "code": "Mailbox Overflow",
    "tags": [
        "Elixir",
        "Erlang/OTP",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Erlang process mailboxes are unbounded queues. In high-throughput Elixir applications, using <code>GenServer.cast/2</code> or asynchronous process messaging without backpressure guarantees can be catastrophic. If an upstream producer emits messages faster than the consumer GenServer's <code>handle_cast/2</code> loop can process them, the target mailbox inflates monotonically.</p><p>As the process message queue grows to millions of unhandled terms, BEAM garbage collection pauses grow exponentially longer, memory usage skyrockets, and the node eventually crashes due to Out-Of-Memory (OOM). Downstream services suffer sudden cascade timeouts as caller processes stall waiting for overwhelmed processes.</p>",
    "root_cause": "Unbounded asynchronous messages sent via GenServer.cast/2 bypassed backpressure controls, causing the consumer's Erlang message queue to consume all heap memory during traffic spikes.",
    "bad_code": "defmodule WorkerConsumer do\n  use GenServer\n\n  # BUG: Receives asynchronous casts continuously without backpressure\n  def handle_cast({:process_data, data}, state) do\n    # Slow I/O operation\n    Process.sleep(50) \n    {:noreply, state}\n  end\nend\n\n# Producer bombards worker process endlessly\nEnum.each(1..1_000_000, fn i ->\n  GenServer.cast(WorkerConsumer, {:process_data, i})\nend)",
    "solution_desc": "Replace asynchronous `GenServer.cast/2` patterns with explicit backpressure using standard `GenStage` demand-driven messaging or bounded worker pools like `NimblePool`. If relying on a GenServer directly, enforce queue-length bounds with soft-dropping or convert calls to synchronous `GenServer.call/3` to naturally rate-limit caller processes.",
    "good_code": "defmodule WorkerConsumer doStatic do\n  use GenServer\n\n  @max_queue_size 10_000\n\n  def push_data(pid, data) dodef\n    {:message_queue_len, len} = Process.info(pid, :message_queue_len)\n    \n    if len > @max_queue_size do\n      {:error, :backpressure_drop}\n    else\n      GenServer.call(pid, {:process_data, data})\n    end\n  end\n\n  def handle_call({:process_data, data}, _from, state) do\n    # Sync call enforces backpressure on producer\n    {:reply, :ok, state}\n  end\nend",
    "verification": "Simulate high load using Erlang performance tools. Run `:erlang.process_info(pid, :message_queue_len)` under benchmark tests to ensure queue lengths remain capped and constant under overload.",
    "date": "2026-08-09",
    "id": 1786248653,
    "type": "error"
});