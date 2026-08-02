window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Bottlenecks & Stalls",
    "slug": "elixir-genserver-mailbox-bottlenecks-beam-stalls",
    "language": "Elixir",
    "code": "Mailbox Bottleneck",
    "tags": [
        "Elixir",
        "BEAM",
        "Concurrency",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In BEAM (Erlang/Elixir virtual machine) systems, each process possesses an isolated message mailbox. While BEAM processes are lightweight, sending asynchronous messages via `GenServer.cast/2` or synchronous `GenServer.call/3` to a single process bottleneck can cause unhandled message queues to explode to millions of items during traffic spikes.</p><p>As the process mailbox grows, matching messages requires traversing the mailbox queue sequentially. Selective receives (`receive do ... end`) scale at O(N) where N is mailbox size. This leads to massive garbage collection pauses, memory consumption spikes, high reduction count usage, and BEAM scheduler thread stalls that cascade across unrelated processes.</p>",
    "root_cause": "A single GenServer process handling high-frequency state updates or writes via unbounded message receiving, combined with pattern matching or slow processing inside `handle_cast/2` / `handle_call/3`.",
    "bad_code": "defmodule MetricsCollector do\n  use GenServer\n\n  # Single global GenServer receiving millions of metric events\n  def track_event(event) do\n    GenServer.cast(__MODULE__, {:track, event})\n  end\n\n  def handle_cast({:track, event}, state) do\n    # Slow synchronous process operation (e.g., DB write or complex processing)\n    Process.sleep(10)\n    {:noreply, [event | state]}\n  end\nend",
    "solution_desc": "Decouple high-throughput message ingestion from state processing using ETS (Erlang Term Storage) with atomic counters, offload processing using process pools (`Poolboy` or `DynamicSupervisor`), or transition from single GenServer pipelines to backpressured stream processing via `GenStage` or `Broadway`.",
    "good_code": "defmodule MetricsCollector do\n  use Supervisor\n\n  def start_link(init_arg) do\n    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)\n  end\n\n  @impl true\n  def init(_init_arg) do\n    # Use lock-free concurrently accessible ETS table\n    :ets.new(:metrics_store, [:named_table, :public, :write_concurrency, :read_concurrency])\n\n    children = [\n      {PartitionSupervisor, child_spec: TaskProducer, name: MetricsCollector.Pool}\n    ]\n\n    Supervisor.init(children, strategy: :one_for_one)\n  end\n\n  # Non-blocking write directly into concurrent ETS table\n  def track_event(event_key) do\n    :ets.update_counter(:metrics_store, event_key, {2, 1}, {event_key, 0})\n  end\nend",
    "verification": "Check active mailbox lengths in runtime using `:erlang.process_info(pid, :message_queue_len)` or telemetry metrics via `:telemetry`. Ensure message queue counts remain negligible under peak load testing.",
    "date": "2026-08-02",
    "id": 1785658009,
    "type": "error"
});