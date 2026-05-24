window.onPostDataLoaded({
    "title": "Fixing Elixir OTP Supervisor Deadlocks",
    "slug": "fixing-elixir-otp-supervisor-deadlocks",
    "language": "Elixir",
    "code": "OTP_SUPERVISOR_DEADLOCK",
    "tags": [
        "Elixir",
        "Erlang",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In highly concurrent Elixir applications, dynamic supervisors are frequently used to spin up worker processes on demand. However, a common deadlock scenario emerges when a child process attempts to synchronously call its own supervisor or another process that is currently blocked waiting for the supervisor's initialization lock. When multiple restarts trigger concurrently, this circular dependency locks the supervisor's message queue, halting the system.</p>",
    "root_cause": "Synchronous calls (like GenServer.call/3) made from within a child process's init/1 block back to the supervising process or to a coordinator registry that is currently blocked by the Supervisor's start sequence.",
    "bad_code": "defmodule MyWorker do\n  use GenServer\n\n  def start_link(args) do\n    GenServer.start_link(__MODULE__, args)\n  end\n\n  def init(args) do\n    # BAD: Synchronous call back to coordinator during startup blocks the supervisor\n    MyCoordinator.register_child(self())\n    {:ok, args}\n  end\nend",
    "solution_desc": "Avoid performing synchronous work inside init/1. Instead, leverage handle_continue/2 (introduced in modern Erlang/Elixir) to perform post-initialization tasks asynchronously immediately after the process has successfully started and released the supervisor's initialization lock.",
    "good_code": "defmodule MyWorker do\n  use GenServer\n\n  def start_link(args) do\n    GenServer.start_link(__MODULE__, args)\n  end\n\n  def init(args) do\n    # GOOD: Return immediately with handle_continue to prevent blocking the supervisor\n    {:ok, args, {:continue, :post_init}}\n  end\n\n  def handle_continue(:post_init, state) do\n    MyCoordinator.register_child(self())\n    {:noreply, state}\n  end\nend",
    "verification": "Run a stress test invoking DynamicSupervisor.start_child/2 concurrently under high load and verify that no supervisor timeouts (:timeout) or process deadlocks occur.",
    "date": "2026-05-24",
    "id": 1779604144,
    "type": "error"
});