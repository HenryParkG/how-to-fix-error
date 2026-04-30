window.onPostDataLoaded({
    "title": "Eliminating Elixir GenServer Mailbox Bloat",
    "slug": "elixir-genserver-backpressure-fix",
    "language": "Go",
    "code": "MailboxOverflow",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir's Actor Model, every GenServer has an unbounded mailbox. Under heavy distributed load, if a producer sends messages via <code>cast/2</code> (asynchronous) faster than the GenServer can process them, the mailbox grows until the node runs out of memory (OOM). This is a common failure mode in distributed backpressure scenarios where the upstream system has no signal to slow down.</p>",
    "root_cause": "Lack of backpressure mechanisms and the use of non-blocking 'cast' operations in a producer-consumer bottleneck.",
    "bad_code": "def handle_info({:data, msg}, state) {\n  # Asynchronous cast provides no backpressure\n  GenServer.cast(Worker, {:process, msg})\n  {:noreply, state}\n}",
    "solution_desc": "Replace 'cast' with 'call' to introduce synchronous backpressure, forcing the producer to wait for the consumer to finish. For high-throughput requirements, use a library like 'GenStage' or 'Broadway' to manage demand-based message flow between stages.",
    "good_code": "def handle_info({:data, msg}, state) {\n  # Synchronous call blocks the producer, creating natural backpressure\n  try do\n    GenServer.call(Worker, {:process, msg}, 5000)\n  catch\n    :exit, _ -> Logger.error(\"Worker timeout\")\n  end\n  {:noreply, state}\n}",
    "verification": "Use ':erlang.process_info(pid, :message_queue_len)' in the observer to verify that the mailbox length remains stable under load.",
    "date": "2026-04-30",
    "id": 1777528213,
    "type": "error"
});