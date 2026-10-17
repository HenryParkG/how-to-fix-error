window.onPostDataLoaded({
    "title": "Fix Elixir GenServer Mailbox Starvation & Bloat",
    "slug": "fix-elixir-genserver-mailbox-starvation-bloat",
    "language": "Elixir",
    "code": "SystemLimitError",
    "tags": [
        "Elixir",
        "BEAM",
        "Concurrency",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang VM (BEAM), each process receives an isolated heap and an unbounded message queue (mailbox). When a <code>GenServer</code> receives incoming cast or call messages faster than it can process them, its mailbox expands unboundedly. Because message passing copies data into the process's private heap (or references off-heap binaries), memory consumption spikes rapidly.</p><p>Crucially, the BEAM scheduler enforces preemption through <em>reductions</em> (roughly equivalent to function calls, with a default budget of 2,000 reductions per timeslice). If a single message handler executes an expensive CPU loop, a blocking NIF, or an unindexed query, the process rapidly exhausts its reduction budget, forcing frequent context switches while messages accumulate in the queue. When the mailbox grows into hundreds of thousands of messages, garbage collection passes must traverse the massive message queue during generational heap sweeps, degrading process throughput and triggering out-of-memory (OOM) kills.</p>",
    "root_cause": "The GenServer acts as a serial bottleneck with no backpressure mechanism, combined with long-running synchronous workloads inside message handlers that starve BEAM scheduling timeslices and trigger OOM from unbounded mailbox allocation.",
    "bad_code": "defmodule IngestionServer do\n  use GenServer\n\n  def handle_cast({:process_payload, raw_data}, state) do\n    # Blocking serialization and heavy CPU hashing in the mailbox receiver\n    parsed = Jason.decode!(raw_data)\n    hash = :crypto.hash(:sha256, :erlang.term_to_binary(parsed))\n    \n    # Synchronous DB write keeps GenServer busy\n    Repo.insert_all(\"telemetry\", [%{hash: hash, data: parsed}])\n    \n    {:noreply, state}\n  end\nend",
    "solution_desc": "Decouple message ingestion from CPU-bound computation and I/O. Use a producer-consumer pattern (such as NimblePool, GenStage, or Broadway) to enforce explicit backpressure, and offload CPU operations to a worker pool or ephemeral Task processes. Monitor process mailbox sizes with :erlang.process_info(pid, :message_queue_len) and reject or buffer requests using rate limiters.",
    "good_code": "defmodule IngestionServer do\n  use GenServer\n\n  @max_queue_len 5_000\n\n  def push_payload(pid, raw_data) do\n    case :erlang.process_info(pid, :message_queue_len) do\n      {:message_queue_len, len} when len > @max_queue_len ->\n        {:error, :overloaded}\n      _ ->\n        GenServer.cast(pid, {:enqueue, raw_data})\n    end\n  end\n\n  def handle_cast({:enqueue, raw_data}, state) do\n    # Offload processing to transient supervised Task\n    Task.Supervisor.start_child(Ingestion.TaskSupervisor, fn ->\n      parsed = Jason.decode!(raw_data)\n      hash = :crypto.hash(:sha256, :erlang.term_to_binary(parsed))\n      Repo.insert_all(\"telemetry\", [%{hash: hash, data: parsed}])\n    end)\n\n    {:noreply, state}\n  end\nend",
    "verification": "Inspect mailbox depth in real-time using `:erlang.process_info(pid, :message_queue_len)` or `:observer.start()`. Run synthetic load tests with dynamic backpressure to ensure the mailbox stabilizes under maximum burst ingress without unbounded memory degradation.",
    "date": "2026-10-17",
    "id": 1792240524,
    "type": "error"
});