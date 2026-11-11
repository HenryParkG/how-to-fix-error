window.onPostDataLoaded({
    "title": "Elixir OTP Mailbox Flooding & GenServer Call Timeouts",
    "slug": "elixir-otp-mailbox-flooding-cascading-timeouts",
    "language": "Elixir",
    "code": "GenServer Timeout (:timeout)",
    "tags": [
        "Elixir",
        "OTP",
        "Concurrency",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Erlang and Elixir processes maintain an unbounded linear message queue (mailbox). When client processes execute synchronous <code>GenServer.call/3</code> or excessive asynchronous <code>GenServer.cast/2</code> invocations faster than the process loop can execute <code>handle_call/3</code> or <code>handle_cast/2</code>, the mailbox memory footprint expands monotonically.</p><p>Because pattern matching across an enormous mailbox requires traversing thousands of messages sequentially, processing latency scales exponentially. Calling processes exceed their 5000ms timeout threshold, crash, and trigger cascading restarts across OTP supervision trees, taking down dependent services.</p>",
    "root_cause": "A single sequential GenServer acting as a centralized bottleneck under high write concurrency without backpressure, causing mailbox queue lengths to exceed the processing rate and exhausting caller timeout budgets.",
    "bad_code": "defmodule WorkerServer do\n  use GenServer\n\n  def start_link(_), do: GenServer.start_link(__MODULE__, [], name: __MODULE__)\n  def submit_work(data), do: GenServer.call(__MODULE__, {:process, data}) # 5000ms default\n\n  def init(state), do: {:ok, state}\n\n  def handle_call({:process, data}, _from, state) do\n    # Expensive I/O or computation directly in the message loop\n    :timer.sleep(100) \n    {:reply, :ok, state}\n  end\nend",
    "solution_desc": "Architect a pool of workers using `PartitionSupervisor` or dynamic dispatch, offload execution from the GenServer state loop using asynchronous tasks, and enforce client-side or queue-level backpressure using `:gen_stage` or rate-limiting monitors.",
    "good_code": "defmodule ResilientWorkerServer do\n  use GenServer\n\n  def start_link(opts) do\n    GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n  end\n\n  def submit_work(data, timeout \\\\ 5000) do\n    case :erlang.process_info(Process.whereis(__MODULE__), :message_queue_len) do\n      {:message_queue_len, len} when len > 1000 ->\n        {:error, :overloaded} # Immediate backpressure signal\n      _ ->\n        GenServer.call(__MODULE__, {:process, data}, timeout)\n    end\n  end\n\n  def init(state), do: {:ok, state}\n\n  def handle_call({:process, data}, from, state) do\n    # Spawn isolated task to prevent blocking the GenServer mailbox\n    Task.Supervisor.start_child(WorkerTaskSupervisor, fn ->\n      result = do_heavy_work(data)\n      GenServer.reply(from, result)\n    end)\n\n    {:noreply, state}\n  end\n\n  defp do_heavy_work(data) do\n    Process.sleep(100)\n    {:ok, data}\n  end\nend",
    "verification": "Simulate high concurrency via a benchmark script (`benchee` or concurrent `Task.async_stream`). Assert `Process.info(pid, :message_queue_len)` stays within bounded limits and verify zero `{:timeout, {GenServer, :call, [...]}}` exits occur.",
    "date": "2026-11-11",
    "id": 1794403678,
    "type": "error"
});