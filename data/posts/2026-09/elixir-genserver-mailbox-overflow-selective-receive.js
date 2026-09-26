window.onPostDataLoaded({
    "title": "Resolving Elixir GenServer Selective Receive Bottlenecks",
    "slug": "elixir-genserver-mailbox-overflow-selective-receive",
    "language": "Rust",
    "code": "ProcessMailboxOverflow",
    "tags": [
        "Rust",
        "Go",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Erlang and Elixir rely on process mailboxes implemented as unbounded FIFO message queues. When an Elixir GenServer implements a selective receive pattern\u2014either explicitly using a custom <code>receive do ... end</code> block or implicitly through internal macros like <code>Task.await/2</code> inside a GenServer callback\u2014the BEAM runtime must scan the entire process mailbox from the head until it encounters a message matching the specified pattern.</p><p>Under sustained high-throughput messaging, if the GenServer receives messages that do not match the immediate receive pattern, those messages remain unconsumed in the mailbox. Subsequent selective receives must traverse an increasingly deep queue of unmatched messages for every single lookup, degrading receive operations from O(1) to O(N) where N is the current mailbox size. This CPU exhaustion prevents the GenServer from processing incoming items at rate parity, inducing a memory ballooning condition (Mailbox Overflow) that terminates the BEAM node via OS OOM-killer.</p>",
    "root_cause": "Executing selective receive operations (such as Task.await or inline receive blocks) inside a busy GenServer forces the BEAM scheduler to scan unmatched messages sequentially, resulting in O(N) traversal latency and catastrophic mailbox bloat.",
    "bad_code": "defmodule IngestionServer do\n  use GenServer\n\n  def handle_cast({:event, payload}, state) do\n    # ANTI-PATTERN: Task.async + Task.await performs a selective receive\n    # within a GenServer processing high-throughput messages.\n    task = Task.async(fn -> Database.write(payload) end)\n    result = Task.await(task, 5000) \n    {:noreply, Map.put(state, :last_result, result)}\n  end\nend",
    "solution_desc": "Architect the GenServer to rely exclusively on strict FIFO consumption via the native handle_info/2 callbacks. Offload asynchronous subtasks using non-blocking monitors (e.g., Task.Supervisor.async_nolink/2) and match their completion messages directly in handle_info/2, ensuring the GenServer process mailbox is drained continuously in O(1) time.",
    "good_code": "defmodule IngestionServer do\n  use GenServer\n\n  def handle_cast({:event, payload}, state) do\n    # Fire-and-track task asynchronously without selective receive blocking\n    task = Task.Supervisor.async_nolink(IngestionTaskSupervisor, fn ->\n      Database.write(payload)\n    end)\n    \n    # Store Task ref to match in handle_info\n    {:noreply, Map.put(state, task.ref, :pending)}\n  end\n\n  # Native GenServer FIFO handling for Task results\n  def handle_info({ref, result}, state) when is_map_key(state, ref) do\n    Process.demonitor(ref, [:flush])\n    new_state = Map.delete(state, ref)\n    {:noreply, Map.put(new_state, :last_result, result)}\n  end\n\n  def handle_info({:DOWN, ref, :process, _pid, _reason}, state) do\n    {:noreply, Map.delete(state, ref)}\n  end\nend",
    "verification": "Execute `:erlang.process_info(pid, :message_queue_len)` under load. Verify that mailbox length remains near zero and does not monotonically increase, and confirm that BEAM CPU scheduler utilization drops significantly during peak load.",
    "date": "2026-09-26",
    "id": 1790410020,
    "type": "error"
});