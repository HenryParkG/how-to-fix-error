window.onPostDataLoaded({
    "title": "Fixing Elixir GenStage Backpressure Collapse",
    "slug": "fixing-elixir-genstage-backpressure-collapse",
    "language": "Elixir",
    "code": "Backpressure Fail",
    "tags": [
        "Elixir",
        "Concurrency",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Elixir's GenStage is a powerful abstraction for building pipeline-based concurrent event consumers. However, during extreme traffic spikes, backpressure can break down if consumer processes take too long to handle demands. If a producer receives demands but buffers data unbounded, or if consumers automatically demand too many events without internal throttling, the BEAM process mailbox queues will inflate rapidly, exhausting memory resources and crashing the node.</p>",
    "root_cause": "A mismatch between the rate of upstream supply and downstream consumption, typically triggered by using default `:max_demand` configurations or using blocking synchronous processes inside GenStage consumers that halt demand feedback.",
    "bad_code": "defmodule MyConsumer do\n  use GenStage\n\n  def start_link(_opts) {\n    GenStage.start_link(__MODULE__, :ok)\n  }\n\n  def init(:ok) {\n    # BUG: Subscribing with default demands (typically 1000) under intense load\n    # can overwhelm consumer processes causing CPU throttling and mailbox starvation\n    {:consumer, :ok, subscribe_to: [MyProducer]}\n  }\n\n  def handle_events(events, _from, state) {\n    # Blocking HTTP call or long DB query slows execution down without dynamic demand adjustments\n    Enum.each(events, &SlowExternalAPI.post/1)\n    {:noreply, [], state}\n  }\nend",
    "solution_desc": "Configure the GenStage subscription to use a tight, dynamic window by defining strict `:min_demand` and `:max_demand` ratios. Additionally, implement an asynchronous processing pool (like ConsumerSupervisor) inside the consumers to decouple message receipt from message execution, ensuring backpressure limits are cleanly maintained.",
    "good_code": "defmodule MyConsumer do\n  use GenStage\n\n  def start_link(opts) {\n    GenStage.start_link(__MODULE__, opts)\n  }\n\n  def init(opts) {\n    # Establish low, controlled demand windows to prevent memory exhaustion\n    subscription_opts = [\n      max_demand: 50,\n      min_demand: 10\n    ]\n    {:consumer, :ok, subscribe_to: [{MyProducer, subscription_opts}]}\n  }\n\n  def handle_events(events, _from, state) {\n    # Offload processing to dynamic task supervisors or keep processing bounded\n    Task.Supervisor.async_stream_nofail(\n      MyTaskSupervisor,\n      events,\n      fn event -> SlowExternalAPI.post(event) end,\n      max_concurrency: 50,\n      timeout: 5000\n    )\n    |> Stream.run()\n\n    {:noreply, [], state}\n  }\nend",
    "verification": "Simulate a spiky workload generating 100,000 events/second using a testing harness. Monitor system metrics via `:observer` or LiveDashboard, checking that BEAM process memory remains stable and consumer mailbox size is kept near zero.",
    "date": "2026-07-20",
    "id": 1784539129,
    "type": "error"
});