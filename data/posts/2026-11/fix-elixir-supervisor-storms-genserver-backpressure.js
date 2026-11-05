window.onPostDataLoaded({
    "title": "Fix Elixir OTP Supervisor Storms & GenServer Overload",
    "slug": "fix-elixir-supervisor-storms-genserver-backpressure",
    "language": "Elixir",
    "code": "MAX_RESTART_REACHED",
    "tags": [
        "Elixir",
        "OTP",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>When an Elixir GenServer experiences massive ingress traffic spikes, its unbounded process mailbox accumulates thousands of pending messages. Downstream database or network latency surges cause requests handled by <code>handle_call/3</code> to exceed client timeout limits (defaulting to 5000ms), leading callers to crash or disconnect.</p><p>As these requests fail, linked processes crash simultaneously. Under standard OTP supervision strategies (e.g., <code>max_restarts: 3, max_seconds: 5</code>), repeated worker failures quickly exhaust the restart budget. This triggers a supervisor crash, which cascades up the supervision tree and causes total application termination, prompting Kubernetes crash loops and pod evictions.</p>",
    "root_cause": "Unbounded process mailboxes coupled with aggressive default supervisor restart thresholds allow unhandled message spikes to cascade crashes upward without backpressure or rate limiting.",
    "bad_code": "defmodule WorkerSupervisor do\n  use Supervisor\n\n  def start_link(init_arg) do\n    # Bug: Aggressive restart limits cause supervisor shutdown on bursts\n    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)\n  end\n\n  @impl true\n  def init(_init_arg) do\n    children = [\n      {PaymentWorker, []}\n    ]\n    # Default max_restarts: 3, max_seconds: 5 cascades failure\n    Supervisor.init(children, strategy: :one_for_one)\n  end\nend",
    "solution_desc": "Architect an explicit backpressure mechanism using message queue length checks and concurrency pooling. Configure dynamic shedding when process mailboxes exceed defined watermarks, and tune supervisor restart strategies using exponential backoff or higher restart limits combined with `:transient` restart specifications.",
    "good_code": "defmodule PaymentWorker do\n  use GenServer, restart: :transient\n  @max_queue_len 1_000\n\n  def handle_call({:process, _payload} = req, from, state) do\n    {:message_queue_len, len} = :erlang.process_info(self(), :message_queue_len)\n    \n    if len > @max_queue_len do\n      {:reply, {:error, :system_overloaded}, state}\n    else\n      # Process actual business logic safely\n      {:reply, :ok, state}\n    end\n  end\nend\n\ndefmodule WorkerSupervisor do\n  use Supervisor\n  def init(_) do\n    children = [{PaymentWorker, []}]\n    # Mitigate restart storms: allow 50 restarts over 10 seconds\n    Supervisor.init(children, strategy: :one_for_one, max_restarts: 50, max_seconds: 10)\n  end\nend",
    "verification": "Simulate high burst concurrency using a load-testing tool (e.g., k6). Verify that mailbox length remains bounded, overloaded calls return `{:error, :system_overloaded}`, and the supervisor remains healthy in telemetry dashboards.",
    "date": "2026-11-05",
    "id": 1793887078,
    "type": "error"
});