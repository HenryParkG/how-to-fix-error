window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Flooding under High Load",
    "slug": "fixing-elixir-genserver-mailbox-flooding-backpressure",
    "language": "Elixir",
    "code": "Mailbox Flooding",
    "tags": [
        "Elixir",
        "OTP",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir and Erlang OTP applications, GenServers process incoming messages sequentially from an unbounded process mailbox. When upstream producers send asynchronous messages (`GenServer.cast/2` or `send/2`) faster than the GenServer's `handle_cast/2` callback can process them, the mailbox grows continuously. This causes huge memory allocation spikes, garbage collection pauses, and eventually crashes the BEAM virtual machine with an Out Of Memory (OOM) error.</p>",
    "root_cause": "Unbounded asynchronous message casting lacks a dynamic backpressure mechanism, allowing producers to overwhelm receiver processes when load spikes occur.",
    "bad_code": "defmodule WorkerEngine do\n  use GenServer\n\n  def push_job(pid, job_data) do\n    # Asynchronous cast allows producer to spam receiver unbounded\n    GenServer.cast(pid, {:process_job, job_data})\n  end\n\n  def handle_cast({:process_job, job_data}, state) do\n    # Expensive computation slowing down consumer processing loop\n    Process.sleep(100)\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Replace asynchronous casts with synchronous calls (`GenServer.call/3`), implement demand-driven backpressure using `GenStage`/`Broadway`, or drop excess messages using bounded queue wrappers.",
    "good_code": "defmodule WorkProducer do\n  use GenStage\n\n  def start_link(initial)\n    GenStage.start_link(__MODULE__, initial, name: __MODULE__)\n  end\n\n  def init(counter), do: {:producer, counter}\n\n  def handle_demand(demand, counter) when demand > 0 do\n    events = Enum.to_list(counter..(counter + demand - 1))\n    {:noreply, events, counter + demand}\n  end\nend\n\ndefmodule WorkConsumer do\n  use GenStage\n\n  def start_link(_opts) do\n    GenStage.start_link(__MODULE__, :ok)\n  end\n\n  def init(:ok) do\n    # Dynamic backpressure bounds max demand\n    {:consumer, :ok, subscribe_to: [{WorkProducer, max_demand: 50, min_demand: 10}]}\n  end\n\n  def handle_events(events, _from, state) do\n    Enum.each(events, &Process.sleep(10))\n    {:noreply, [], state}\n  end\nend",
    "verification": "Inspect running processes under stress testing using `:erlang.process_info(pid, :message_queue_len)` to ensure process mailbox sizes remain bounded below target thresholds.",
    "date": "2026-07-29",
    "id": 1785313269,
    "type": "error"
});