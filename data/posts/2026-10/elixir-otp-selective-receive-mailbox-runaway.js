window.onPostDataLoaded({
    "title": "Resolving Elixir GenServer Selective Receive Leaks",
    "slug": "elixir-otp-selective-receive-mailbox-runaway",
    "language": "Docker",
    "code": "ProcessOutOfMemory",
    "tags": [
        "Docker",
        "Kubernetes",
        "Elixir",
        "OTP",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang/Elixir BEAM virtual machine, each actor process has an unbounded private message mailbox. When a process issues a <code>receive</code> block with pattern matching, BEAM iterates through the mailbox linearly from oldest to newest message until finding one that satisfies the pattern. Messages that do not match remain in the mailbox in their original order.</p><p>When developers introduce selective receives inside a GenServer callback (such as synchronizing an external request using an internal correlation ID) without a wildcard catch-all, unmatched GenServer messages (calls, casts, system messages) accumulate. Subsequent receives must scan an ever-expanding queue in O(N) time. The process becomes CPU-bound, garbage collection stalls, and process memory grows exponentially until the BEAM node crashes with memory exhaustion.</p>",
    "root_cause": "Using explicit selective receive blocks inside GenServer callbacks without handling unmatching messages, causing O(N) linear mailbox scanning and process memory leaks.",
    "bad_code": "defmodule WorkerGenServer do\n  use GenServer\n\n  def handle_call({:fetch_external, req_id}, _from, state) do\n    # Anti-Pattern: Selective receive inside GenServer callback\n    # All other incoming calls/casts accumulate in the mailbox\n    receive do\n      {:response, ^req_id, result} ->\n        {:reply, result, state}\n    after\n      5000 ->\n        {:reply, {:error, :timeout}, state}\n    end\n  end\nend",
    "solution_desc": "Eliminate nested selective receive blocks. Manage correlation IDs and pending requests directly inside the GenServer state, handling all incoming asynchronous payloads through standard handle_info/2 callbacks.",
    "good_code": "defmodule WorkerGenServer do\n  use GenServer\n\n  defstruct pending: %{}\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, opts)\n\n  def init(_), do: {:ok, %WorkerGenServer{}}\n\n  def handle_call({:fetch_external, req_id}, from, state) do\n    # Store the client 'from' reference indexed by correlation ID\n    # Set an OTP timer for cancellation if needed\n    Process.send_after(self(), {:timeout, req_id}, 5000)\n    {:noreply, %{state | pending: Map.put(state.pending, req_id, from)}}\n  end\n\n  def handle_info({:response, req_id, result}, state) do\n    case Map.pop(state.pending, req_id) do\n      {nil, _new_pending} ->\n        {:noreply, state}\n      {from, new_pending} ->\n        GenServer.reply(from, {:ok, result})\n        {:noreply, %{state | pending: new_pending}}\n    end\n  end\n\n  def handle_info({:timeout, req_id}, state) do\n    case Map.pop(state.pending, req_id) do\n      {nil, _new_pending} -> {:noreply, state}\n      {from, new_pending} ->\n        GenServer.reply(from, {:error, :timeout})\n        {:noreply, %{state | pending: new_pending}}\n    end\n  end\nend",
    "verification": "Monitor mailbox depth using `:erlang.process_info(pid, :message_queue_len)` under load. Ensure the queue length returns to 0 and does not grow monotonically.",
    "date": "2026-10-10",
    "id": 1791602700,
    "type": "error"
});