window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Explosions",
    "slug": "elixir-genserver-mailbox-explosion-backpressure",
    "language": "Docker",
    "code": "ProcessQueueOverflow",
    "tags": [
        "Docker",
        "Kubernetes",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Erlang and Elixir BEAM architectures, each process contains an isolated, unbounded FIFO message mailbox. When client processes dispatch asynchronous commands via <code>GenServer.cast/2</code> or raw <code>send/2</code> at a rate exceeding the GenServer's sequential execution throughput, unconsumed message tuples accumulate unbounded in the heap.</p><p>Because every buffered message consumes memory in the process's private memory space, message accumulation triggers rapid heap growth. This forces the BEAM garbage collector to run repeatedly over expanding heaps, consuming severe CPU cycles and slowing down message consumption even further. Left unchecked, the entire virtual machine collapses under memory exhaustion or gets terminated by container orchestration watchdogs.</p>",
    "root_cause": "Unbounded asynchronous message dispatching (handle_cast) without backpressure mechanisms or queue length bounding, causing exponential message queue bloat and eventual process heap exhaustion.",
    "bad_code": "defmodule IngestServer do\n  use GenServer\n\n  def handle_cast({:process_metric, metric}, state) do\n    # Unbounded cast calls queue up here; slow database I/O creates bottlenecks\n    :timer.sleep(50)\n    save_to_db(metric)\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Replace asynchronous unbounded casting with synchronous bounded calls (GenServer.call) to force caller-side backpressure, or employ rate-limiting pipelines like Broadway/GenStage with explicit demand management to reject or shed excess load.",
    "good_code": "defmodule IngestServer do\n  use GenServer\n  @max_queue_len 5_000\n\n  # Enforce caller backpressure via GenServer.call\n  def push_metric(pid, metric) do\n    {:message_queue_len, len} = Process.info(pid, :message_queue_len)\n    if len > @max_queue_len do\n      {:error, :overloaded} # Immediate load shedding / circuit breaking\n    else\n      GenServer.call(pid, {:process_metric, metric}, 5_000)\n    end\n  end\n\n  def handle_call({:process_metric, metric}, _from, state) do\n    save_to_db(metric)\n    {:reply, :ok, state}\n  end\nend",
    "verification": "Monitor process message queue lengths using ':observer.start()' in development or run 'Process.info(pid, :message_queue_len)' in telemetry handlers to verify queue lengths stay within bounded limits during synthetic load spikes.",
    "date": "2026-10-20",
    "id": 1792483589,
    "type": "error"
});