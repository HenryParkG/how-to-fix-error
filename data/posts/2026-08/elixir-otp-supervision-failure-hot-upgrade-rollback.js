window.onPostDataLoaded({
    "title": "Fix OTP Supervision Crashes & Hot Upgrade Bugs",
    "slug": "elixir-otp-supervision-failure-hot-upgrade-rollback",
    "language": "Elixir",
    "code": "MaxRestartReached",
    "tags": [
        "Docker",
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir/OTP systems, GenServer crashes are contained by Supervisors. However, when child processes crash repeatedly in quick succession (e.g., failing database connections or unhandled deserialization errors), the supervisor reaches its max restart intensity limit (default: 3 crashes within 5 seconds) and terminates itself, cascading failures up to the Application supervisor.</p><p>During hot code upgrades (`relup`), unhandled state transitions inside `code_change/3` callback definitions cause GenServers to crash on version migration, precipitating catastrophic supervisor termination and forced deployment rollbacks across the cluster.</p>",
    "root_cause": "Aggressive unhandled errors exceeding supervisor restart frequency limits and missing version-matching clauses in GenServer `code_change/3` callbacks.",
    "bad_code": "defmodule Core.Worker do\n  use GenServer\n\n  def init(args) do\n    # Bug: Unhandled network crash triggers immediate restart loop\n    {:ok, connect_external_api!(args)}\n  end\n\n  # Bug: Missing clause for previous release state schema during hot reload\n  def code_change(_old_vsn, state, _extra) do\n    {:ok, state}\n  end\nend",
    "solution_desc": "Decouple risky initialization to asynchronous `:continue` steps with exponential backoff, configure supervisor thresholds defensively, and implement explicit pattern-matched state migrations in `code_change/3`.",
    "good_code": "defmodule Core.Worker do\n  use GenServer, restart: :transient\n\n  def init(args) do\n    {:ok, %{args: args, client: nil, retry_count: 0}, {:continue, :connect}}\n  end\n\n  def handle_continue(:connect, state) do\n    case safe_connect(state.args) do\n      {:ok, client} -> {:noreply, %{state | client: client, retry_count: 0}}\n      {:error, _} ->\n        Process.send_after(self(), :retry_connect, 1000)\n        {:noreply, %{state | retry_count: state.retry_count + 1}}\n    end\n  end\n\n  def code_change({\"1.0.0\", :legacy}, %{old_key: val} = state, _extra) do\n    new_state = state |> Map.delete(:old_key) |> Map.put(:new_key, val)\n    {:ok, new_state}\n  end\n  def code_change(_old_vsn, state, _extra), do: {:ok, state}\nend",
    "verification": "Execute release upgrades via `mix release` test scenarios, simulate downstream outages using Chaos Mesh in staging, and inspect supervision health via `:observer.start()` or Telemetry metrics.",
    "date": "2026-08-22",
    "id": 1787369687,
    "type": "error"
});