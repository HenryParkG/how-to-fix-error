window.onPostDataLoaded({
    "title": "Fixing BEAM Mailbox Exhaustion in Elixir GenServers",
    "slug": "fixing-beam-mailbox-exhaustion-elixir-genservers",
    "language": "Elixir",
    "code": "Mailbox Exhaustion / O(N) Scan",
    "tags": [
        "Elixir",
        "BEAM",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Elixir applications, GenServers can suffer severe latency amplification and eventual out-of-memory crashes due to BEAM mailbox exhaustion. When code uses selective receive blocks (e.g., waiting for specific task references with <code>receive do</code>) inside a process handling an influx of other messages, the Erlang VM must scan every non-matching message sequentially. This turns message processing from O(1) into O(N) linear iteration over thousands of queued messages, stalling the process scheduler loop.</p>",
    "root_cause": "Using inner selective receive calls inside an active GenServer or process. Unmatched messages accumulate in the process mailbox, forcing every subsequent selective receive scan to traverse the entire mailbox queue.",
    "bad_code": "defmodule BadWorker do\n  use GenServer\n\n  def handle_call({:fetch_remote, url}, _from, state) do\n    # BUG: Spawning async task and waiting with selective receive inside GenServer loop\n    task = Task.async(fn -> HttpClient.get(url) end)\n    \n    # Selective receive scans the entire mailbox to match %Task{ref: ref}\n    result = Task.await(task, 5000)\n    {:reply, result, state}\n  end\n\n  def handle_info(_other_msg, state) do\n    # Unmatched messages accumulate rapidly if incoming rate > processing rate\n    {:noreply, state}\n  end\nend",
    "solution_desc": "Eliminate inline selective receives. Delegate asynchronous background processing to dedicated worker pools (`Task.Supervisor` or `gen_statem`) and handle responses non-blockingly via explicit `handle_info/2` callbacks, preserving O(1) constant-time process mailbox access.",
    "good_code": "defmodule GoodWorker do\n  use GenServer\n\n  def handle_call({:fetch_remote, url}, from, state) do\n    # FIX: Non-blocking task yield; return reply later without stalling process mailbox\n    Task.Supervisor.async_nolink(MyApp.TaskSupervisor, fn ->\n      {from, HttpClient.get(url)}\n    end)\n    {:noreply, state}\n  end\n\n  # Process task results asynchronously via normal message queue\n  def handle_info({_ref, {from, result}}, state) do\n    GenServer.reply(from, result)\n    {:noreply, state}\n  end\n\n  def handle_info({:DOWN, _ref, :process, _pid, _reason}, state) do\n    {:noreply, state}\n  end\nend",
    "verification": "Monitor process message queue length using `:erlang.process_info(pid, :message_queue_len)` under synthetic load testing with `Vegeta` or `k6`. Mailbox size should remain near zero.",
    "date": "2026-07-24",
    "id": 1784871684,
    "type": "error"
});