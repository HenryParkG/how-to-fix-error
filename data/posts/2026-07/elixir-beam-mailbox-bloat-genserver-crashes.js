window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Bloat & Process Crashes",
    "slug": "elixir-beam-mailbox-bloat-genserver-crashes",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Elixir",
        "BEAM",
        "GenServer",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang/Elixir BEAM VM, every process possesses an unbounded message queue (mailbox). A GenServer processes incoming messages synchronously and sequentially inside its execution loop. When producers send asynchronous messages via <code>GenServer.cast/2</code> faster than the server process can handle, the mailbox grows continuously.</p><p>This mailbox bloat degrades pattern-matching efficiency, causes massive Garbage Collection pauses as the process memory grows into gigabytes, and ultimately causes node OOM (Out Of Memory) crashes or process termination due to memory exhaustion.</p>",
    "root_cause": "A single GenServer handled both computational workload and message processing sequentially while receiving unbounded cast calls from hundreds of concurrent caller processes without backpressure.",
    "bad_code": "defmodule MetricsCollector do\n  use GenServer\n\n  # BUG: Receives high-volume incoming messages faster than synchronous write allows\n  def handle_cast({:track_event, event}, state) do\n    # Expensive network/disk IO call inside single GenServer process loop\n    DB.insert_event(event) \n    {:noreply, state}\n  end\nend",
    "solution_desc": "Implement dynamic worker pools using Task.Supervisor or NimblePool to offload work, apply backpressure mechanisms with GenStage/Broadway, or drop messages when queue limits are exceeded using explicit queue metrics monitoring.",
    "good_code": "defmodule MetricsCollector do\n  use GenServer\n\n  @doc \"\"\"\n  Offloads execution to Task.Supervisor worker pool to keep GenServer process \n  mailbox small and responsive.\n  \"\"\"\n  def handle_cast({:track_event, event}, state) do\n    Task.Supervisor.start_child(MetricsTaskSupervisor, fn ->\n      DB.insert_event(event)\n    end)\n    {:noreply, state}\n  end\n\n  # Fallback handler to avoid selective receive mailbox accumulation\n  def handle_info(unexpected_msg, state) do\n    Logger.warning(\"Unhandled message in mailbox: #{inspect(unexpected_msg)}\")\n    {:noreply, state}\n  end\nend",
    "verification": "Inspect process mailbox size dynamically during stress testing using `:erlang.process_info(pid, :message_queue_len)`. Verify queue length remains stable (< 100) under maximum throughput load.",
    "date": "2026-07-28",
    "id": 1785202993,
    "type": "error"
});