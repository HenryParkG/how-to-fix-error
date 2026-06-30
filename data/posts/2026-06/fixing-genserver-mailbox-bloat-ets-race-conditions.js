window.onPostDataLoaded({
    "title": "Fixing GenServer Mailbox Bloat & ETS Races under Load",
    "slug": "fixing-genserver-mailbox-bloat-ets-race-conditions",
    "language": "Elixir / OTP",
    "code": "GENSERVER_MAILBOX_FLOOD",
    "tags": [
        "Go",
        "Rust",
        "Elixir",
        "OTP",
        "Error Fix"
    ],
    "analysis": "<p>In highly concurrent Elixir/OTP architectures, GenServers are often used to aggregate system states or cache fast-moving metrics. Because GenServers process incoming messages sequentially, exposing them to massive external message rates (e.g., hundreds of thousands of casts/calls per second) leads to GenServer mailbox bloat. Memory spikes follow, and callers start experiencing timeouts. To alleviate this, developers often offload state to Erlang Term Storage (ETS) tables, but naive reads and updates can create race conditions.</p>",
    "root_cause": "GenServers execute sequentially, causing messages to queue up in the Process mailbox when the generation rate exceeds consumption speed. Moving state to an ETS table avoids the mailbox bottleneck, but non-atomic read-modify-write patterns (e.g. querying a value with `:ets.lookup` and writing back with `:ets.insert`) introduce race conditions when executed concurrently by multiple Erlang processes.",
    "bad_code": "defmodule BadMetricsStore do\n  use GenServer\n  \n  def start_link(_) do\n    GenServer.start_link(__MODULE__, nil, name: __MODULE__)\n  end\n\n  def init(_) do\n    :ets.new(:metrics, [:public, :named_table, :set])\n    {:ok, nil}\n  end\n\n  # Bottleneck & Race Condition\n  def handle_call({:increment, key}, _from, state) do\n    current = case :ets.lookup(:metrics, key) do\n      [{^key, val}] -> val\n      [] -> 0\n    end\n    # Unsafe concurrent write if external processes access ETS table\n    :ets.insert(:metrics, {key, current + 1})\n    {:reply, :ok, state}\n  end\nend",
    "solution_desc": "Decouple the GenServer from the direct read/write pipeline entirely. Use an ETS table initialized with `write_concurrency: :auto` and `read_concurrency: true`. Instruct calling client processes to invoke atomic ETS mutation operations (such as `:ets.update_counter/4`) directly from their own processes, bypassing the single-threaded GenServer process mailbox completely.",
    "good_code": "defmodule GoodMetricsStore do\n  use GenServer\n\n  def start_link(_) do\n    GenServer.start_link(__MODULE__, nil, name: __MODULE__)\n  end\n\n  def init(_) do\n    # Optimized for concurrent multi-process reads and atomic writes\n    :ets.new(:metrics, [\n      :public,\n      :named_table,\n      :set,\n      {:write_concurrency, :auto},\n      {:read_concurrency, true}\n    ])\n    {:ok, nil}\n  end\n\n  # Bypasses the GenServer mailbox entirely!\n  # Executed inside the caller's process context safely and atomically.\n  def increment(key) do\n    # update_counter is atomic at the Erlang VM level, preventing races.\n    :ets.update_counter(:metrics, key, {2, 1}, {key, 0})\n  end\nend",
    "verification": "Utilize Elixir's `:observer.start()` to track mailbox queue length during artificial spike testing. Spawn 100,000 parallel Tasks executing `GoodMetricsStore.increment/1` simultaneously. Verify that message queue sizes remain zero and verify that aggregate counts match expected transaction sums precisely.",
    "date": "2026-06-30",
    "id": 1782786737,
    "type": "error"
});