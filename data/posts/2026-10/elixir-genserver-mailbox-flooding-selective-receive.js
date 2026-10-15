window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Floods & Receive Traps",
    "slug": "elixir-genserver-mailbox-flooding-selective-receive",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Elixir",
        "OTP",
        "Concurrency",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>BEAM process mailboxes are unbounded FIFO queues. In an Elixir application, when a <code>GenServer</code> receives messages faster than it can process them, the message queue grows rapidly, inflating the process heap and triggering frequent, uncollectible garbage collection passes.</p><p>This issue is worsened by selective receive clauses (e.g., using raw <code>receive do</code> blocks inside callback functions). BEAM scans the mailbox sequentially looking for matching patterns. If unmatched messages sit in the queue, each lookup degrades from $O(1)$ to $O(N)$, locking the process in CPU-bound traversal loops and culminating in VM-wide memory exhaustion.</p>",
    "root_cause": "Unbounded message producers outpace single-process consumer capacity, combined with selective receive patterns that force $O(N)$ traversal over hundreds of thousands of queued messages.",
    "bad_code": "defmodule MetricsCollector do\n  use GenServer\n\n  # Antipattern: Asynchronous cast without backpressure allows clients to inundate queue\n  def handle_cast({:track_event, event_data}, state) do\n    # Dangerous: Raw selective receive scans mailbox for custom token\n    receive do\n      {:priority_flush, ref} -> \n        IO.inspect(ref)\n    after 0 ->\n        :ok\n    end\n    \n    {:noreply, [event_data | state]}\n  end\nend",
    "solution_desc": "Replace raw selective receive patterns with standard GenServer message handling to maintain predictable $O(1)$ dequeuing. Implement bounded message processing using `GenStage` or `Broadway` to establish explicit backpressure from consumers to producers.",
    "good_code": "defmodule MetricsCollector do\n  use GenServer\n\n  @max_queue_threshold 10_000\n\n  def init(init_arg), do: {:ok, init_arg}\n\n  # Pattern match through regular GenServer callbacks, avoiding raw receive blocks\n  def handle_call({:track_event, event_data}, _from, state) do\n    {:message_queue_len, queue_len} = :erlang.process_info(self(), :message_queue_len)\n\n    if queue_len > @max_queue_threshold do\n      # Apply backpressure by rejecting or shedding load\n      {:reply, {:error, :mailbox_overload}, state}\n    else\n      {:reply, :ok, [event_data | state]}\n    end\n  end\n\n  def handle_info({:priority_flush, ref}, state) do\n    # Explicit message handler preserves O(1) FIFO semantics\n    {:noreply, state}\n  end\nend",
    "verification": "Monitor process queues in production using `:observer.start()` or telemetry measuring `:erlang.process_info(pid, :message_queue_len)`. Validate that message queue depths stay within bounded limits during spike testing.",
    "date": "2026-10-15",
    "id": 1792072096,
    "type": "error"
});