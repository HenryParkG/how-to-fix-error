window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Bloat under Burst Load",
    "slug": "fixing-elixir-genserver-mailbox-bloat",
    "language": "Elixir",
    "code": "OOM / Mailbox Bloat",
    "tags": [
        "Elixir",
        "Go",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir and Erlang/OTP, every process has an unbounded, sequential message queue (mailbox). When a GenServer receives messages at a rate higher than its processing capability, the mailbox size grows linearly. This consumes memory directly proportional to the queue length, eventually leading to Erlang Virtual Machine (BEAM) memory exhaustion and an ungraceful OOM crash. Under massive burst loads, synchronous <code>GenServer.call/3</code> timeouts can exacerbate the issue, forcing caller processes to abandon their requests while the target GenServer continues to waste CPU cycles processing stale, timed-out messages.</p>",
    "root_cause": "The target GenServer processes messages sequentially on a single logical thread. Under heavy traffic bursts, the ingress rate surpasses the processing rate, causing the message queue to accumulate infinitely, consuming system memory until the OS killer or BEAM allocator terminates the node.",
    "bad_code": "defmodule PaymentProcessor do\n  use GenServer\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, :ok, opts)\n\n  def init(:ok), do: {:ok, %{}}\n\n  # Vulnerable to mailbox bloat under high concurrent traffic\n  def handle_cast({:process_payment, transaction}, state) do\n    # Simulating heavy network I/O or CPU work\n    :timer.sleep(100)\n    IO.puts(\"Processed: #{transaction.id}\")\n    {:noreply, state}\n  end\nend",
    "solution_desc": "To resolve mailbox bloat, replace sequential processing with a task-offloading pattern or introduce backpressure. By spinning up short-lived tasks under a `Task.Supervisor` inside the GenServer, the server process only acts as a fast dispatcher. Alternatively, you can use pool management or rate-limiting tools like Poolboy or Broadway to drop or reject requests when the message queue size exceeds a safe threshold.",
    "good_code": "defmodule PaymentProcessor do\n  use GenServer\n  \n  @max_queue_len 1000\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, :ok, opts)\n\n  def init(:ok) do\n    {:ok, %{}}\n  end\n\n  # Protect the mailbox using backpressure and fast task dispatching\n  def handle_cast({:process_payment, transaction}, state) do\n    {:message_queue_len, queue_len} = Process.info(self(), :message_queue_len)\n\n    if queue_len > @max_queue_len do\n      # Reject load early to prevent memory exhaustion (Load Shedding)\n      IO.puts(\"System overloaded. Dropping transaction: #{transaction.id}\")\n      {:noreply, state}\n    else\n      # Offload execution to a Task.Supervisor to keep the GenServer mailbox empty\n      Task.Supervisor.start_child(PaymentTaskSupervisor, fn ->\n        :timer.sleep(100)\n        IO.puts(\"Processed: #{transaction.id}\")\n      end)\n\n      {:noreply, state}\n    end\n  end\nend",
    "verification": "Deploy a synthetic load-test script that shoots 50,000 requests into the system within 3 seconds. Use `:observer.start()` or run `Process.info(pid, :message_queue_len)` in your terminal. Verify that the message queue length of `PaymentProcessor` stays well below the defined ceiling (1000) and that overflow tasks are rejected gracefully without spiking overall system memory.",
    "date": "2026-05-29",
    "id": 1780020823,
    "type": "error"
});