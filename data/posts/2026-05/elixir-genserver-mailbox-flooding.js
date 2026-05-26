window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Flooding",
    "slug": "elixir-genserver-mailbox-flooding",
    "language": "Elixir",
    "code": "MAILBOX_FLOODING",
    "tags": [
        "Kubernetes",
        "Elixir",
        "Erlang",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang VM (BEAM), processes communicate via message queues. Each process has its own unbounded mailbox. When one process sends messages to another using cast or raw sends, the message is instantly placed into the recipient's mailbox. If the consuming process processes messages slower than they arrive, the mailbox grows indefinitely.</p><p>This leads to memory exhaustion (OOM crashes) and severe CPU degradation, because searching through an extremely large mailbox for selective matches requires scanning millions of elements, scaling quadratically. Under high-throughput backpressure failures, a downstream system slowdown cascades backwards and floods the orchestrating GenServer's queue.</p>",
    "root_cause": "The architectural reliance on asynchronous `GenServer.cast/2` without any backpressure mechanism (like a token bucket, pull-based queue, or bounded consumer group) allows producers to push messages faster than the consumer can process them.",
    "bad_code": "defmodule UnboundedConsumer do\n  use GenServer\n\n  def handle_cast({:process_job, data}, state) do\n    # Simulating heavy external API call or disk I/O\n    Process.sleep(50)\n    {:noreply, state}\n  end\nend\n\n# Client caller code flooding the queue asynchronously:\nEnum.each(1..100_000, fn id ->\n  GenServer.cast(UnboundedConsumer, {:process_job, id})\nend)",
    "solution_desc": "Architect a pull-based backpressure pattern using Elixir's GenStage, Broadway, or simple synchronous `GenServer.call/3` mechanisms. By switching to synchronous calls with timeouts, or introducing dynamic rate-limiting pools, the producer is forced to block or back off when the consumer is busy.",
    "good_code": "defmodule BoundedConsumer do\n  use GenServer\n\n  # Client API uses call instead of cast to block the caller until complete\n  def process_job(pid, data) do\n    GenServer.call(pid, {:process_job, data}, :infinity)\n  end\n\n  def handle_call({:process_job, data}, _from, state) do\n    # Process data synchronously to enforce natural backpressure\n    result = heavy_computation(data)\n    {:reply, {:ok, result}, state}\n  end\n\n  defp heavy_computation(data) do\n    Process.sleep(50)\n    data\n  end\nend",
    "verification": "Monitor the mailbox length using `:erlang.process_info(pid, :message_queue_len)` under load. Verify that the queue length remains stable near zero, while calling processes slow down or block dynamically when processing capacity is saturated.",
    "date": "2026-05-26",
    "id": 1779777559,
    "type": "error"
});