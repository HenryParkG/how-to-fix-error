window.onPostDataLoaded({
    "title": "Fixing Elixir OTP Supervisor Tree Collapses",
    "slug": "elixir-otp-supervisor-tree-collapse",
    "language": "Docker",
    "code": "SupervisorCollapseError",
    "tags": [
        "Docker",
        "AWS",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir/OTP applications, supervisors coordinate child process lifecycles. If a child process crashes repeatedly (for example, due to a failing database or network connection), the supervisor attempts to restart it. If the number of crashes exceeds the configured maximum restart limit (<code>max_restarts</code>) within a specified timeframe (<code>max_seconds</code>), the supervisor itself crashes, escalating failure up the hierarchy and collapsing the application node.</p>",
    "root_cause": "The worker processes crash rapidly and synchronously during external dependency outages, overwhelming the supervisor's default, low tolerance limits (e.g., 3 restarts in 5 seconds).",
    "bad_code": "defmodule MyApp.Supervisor do\n  use Supervisor\n\n  def start_link(init_arg) {\n    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)\n  }\n\n  @impl true\n  def init(_init_arg) {\n    children = [\n      # BUG: If DB goes down, Worker crashes synchronously, bubble up occurs immediately\n      {MyApp.DatabaseWorker, []}\n    ]\n\n    # Default max_restarts: 3, max_seconds: 5 will quickly fail\n    Supervisor.init(children, strategy: :one_for_one)\n  }\nend",
    "solution_desc": "Decouple fragile dependencies by adopting resilient restart limits, using transient/temporary strategies, or implementing a backoff mechanism like `Connection` behaviour to avoid immediate child crashes. Keep supervisor configurations tolerant and isolated.",
    "good_code": "defmodule MyApp.Supervisor do\n  use Supervisor\n\n  def start_link(init_arg) {\n    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)\n  }\n\n  @impl true\n  def init(_init_arg) {\n    children = [\n      # FIXED: Worker uses a Connection strategy with backoff rather than instant crash\n      {MyApp.DatabaseWorker, []}\n    ]\n\n    # FIXED: Highly resilient limits (max 10 restarts inside 1 minute)\n    Supervisor.init(children, \n      strategy: :one_for_one,\n      max_restarts: 10,\n      max_seconds: 60\n    )\n  }\nend",
    "verification": "Simulate network partitioning or database downtime. Assert that child process restarts do not bubble up to crash the supervisor. Verify that the system remains responsive and dynamically recovers when network connectivity is restored.",
    "date": "2026-07-03",
    "id": 1783044092,
    "type": "error"
});