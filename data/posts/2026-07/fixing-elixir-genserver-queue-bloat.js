window.onPostDataLoaded({
    "title": "Fixing Elixir OTP GenServer Queue Bloat",
    "slug": "fixing-elixir-genserver-queue-bloat",
    "language": "Elixir",
    "code": "GenServer Mailbox Bloat",
    "tags": [
        "Elixir",
        "OTP",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir, process mailboxes are unbounded by default. When an actor or GenServer experiences a massive influx of messages (producers) that outpaces its execution speed (consumer), the message queue grows unchecked. This results in memory bloat and can trigger Erlang VM (BEAM) Out-Of-Memory (OOM) crashes. Additionally, long message queues degrade lookup performance for selective receives and cause severe latency spikes, starving down-stream actors expecting prompt responses.</p>",
    "root_cause": "The root cause is blocking operations (like slow HTTP requests, synchronous DB calls, or intensive CPU tasks) executed synchronously inside the GenServer's execution loop (e.g., within handle_cast/2 or handle_call/3), which blocks the process from fetching the next message in its mailbox.",
    "bad_code": "defmodule HeavyWorker do\n  use GenServer\n\n  def start_link(init_arg), do: GenServer.start_link(__MODULE__, init_arg, name: __MODULE__)\n\n  # Bug: Blocking I/O or processing inside the message loop blocks execution\n  def handle_cast({:process_data, data}, state) do\n    Process.sleep(100) # Simulate a slow database write or external API call\n    {:noreply, state}\n  end\nend",
    "solution_desc": "To fix this, offload blockable operations from the main GenServer loop using dynamic task workers or Task.Supervisor, which maintains the GenServer's responsiveness. Additionally, we can implement explicit backpressure mechanisms or rate-limiting to throttle incoming messages.",
    "good_code": "defmodule HeavyWorker do\n  use GenServer\n\n  def start_link(init_arg), do: GenServer.start_link(__MODULE__, init_arg, name: __MODULE__)\n\n  def handle_cast({:process_data, data}, state) do\n    # Offload the execution to an unlinked Task supervised globally\n    Task.Supervisor.start_child(MyApp.TaskSupervisor, fn ->\n      Process.sleep(100) # Task handles the heavy lifting safely\n    end)\n    {:noreply, state}\n  end\nend",
    "verification": "Verify by sending a burst of concurrent messages to the GenServer and calling `:erlang.process_info(pid, :message_queue_len)` in an IEx terminal. The queue length should quickly return to 0, and memory usage should stay constant.",
    "date": "2026-07-15",
    "id": 1784112155,
    "type": "error"
});