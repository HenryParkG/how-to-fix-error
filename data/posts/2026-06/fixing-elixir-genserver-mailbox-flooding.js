window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Flooding",
    "slug": "fixing-elixir-genserver-mailbox-flooding",
    "language": "Elixir",
    "code": "Mailbox Flooding",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In the BEAM virtual machine, actor mailboxes are unbounded by default. When a GenServer is subjected to high-throughput asynchronous writes (via <code>handle_cast/2</code> or rapid asynchronous <code>send/2</code> calls) and its processing logic is bound by network or disk I/O, the mailbox size grows exponentially. This causes massive memory growth (OOM) and increases garbage collection latency inside the scheduler. Because there is no backpressure mechanism built into native message passing, the producer processes keep pushing tasks until the system crashes. This failure mode commonly occurs during high-volume API ingestions or database batch writes where downstream bottlenecks throttle processing speeds.</p>",
    "root_cause": "The use of asynchronous `GenServer.cast/2` under high load bypasses the synchronization block of the actor model. The calling process doesn't wait for a response, preventing the system from propagating load pressure up to the producer.",
    "bad_code": "defmodule IngestionWorker do\n  use GenServer\n\n  def init(state), do: {:ok, state}\n\n  # Non-blocking cast that buffers data without checking downstream availability\n  def handle_cast({:process_payload, payload}, state) do\n    # Simulate slow I/O bound processing\n    Process.sleep(100)\n    {:noreply, [payload | state]}\n  end\nend",
    "solution_desc": "To solve this architectural issue, we must introduce backpressure. Instead of using asynchronous `cast` calls, we can implement synchronous `GenServer.call/3` protocols that block the sender until the message is consumed. For highly scalable pipelines, use `GenStage` or a pooling mechanism like `NimblePool` that relies on consumer-demand-driven pipelines, where the consumer pulls events only when it has the capacity to process them.",
    "good_code": "defmodule BoundedIngestionWorker do\n  use GenServer\n  \n  @max_queue_size 1000\n\n  def init(state), do: {:ok, Map.merge(state, %{queue_size: 0})}\n\n  # Synchronous call protocol that tracks active load and rejects when overloaded\n  def handle_call({:process_payload, payload}, _from, %{queue_size: size} = state) when size >= @max_queue_size do\n    {:reply, {:error, :rate_limited}, state}\n  end\n\n  def handle_call({:process_payload, payload}, _from, state) do\n    # Simulate slow processing asynchronously using Task to free up the GenServer\n    Task.Supervisor.start_child(MyTaskSupervisor, fn ->\n      do_slow_io(payload)\n    end)\n    \n    {:reply, :ok, Map.put(state, :queue_size, state.queue_size + 1)}\n  end\n\n  defp do_slow_io(_payload), do: Process.sleep(100)\nend",
    "verification": "Use `:erlang.process_info(pid, :message_queue_len)` inside a load-testing suite. Verify that the message queue length remains bound under maximum system load, and that producers receive a `{:error, :rate_limited}` tuple or experience predictable synchronous blocking.",
    "date": "2026-06-05",
    "id": 1780642730,
    "type": "error"
});