window.onPostDataLoaded({
    "title": "Fix GenServer Mailbox Congestion & Cascading Timeouts",
    "slug": "elixir-otp-mailbox-congestion-genserver-timeouts",
    "language": "Go",
    "code": "GenServer.call Timeout",
    "tags": [
        "Elixir",
        "BEAM",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Erlang and Elixir processes communicate via asynchronous message passing backed by an unbounded mailbox. When a client executes <code>GenServer.call/3</code>, the caller blocks waiting for a synchronous reply with an implicit default timeout of 5,000 milliseconds. If the receiving GenServer executes high-latency logic\u2014such as synchronous database queries, slow external HTTP requests, or unoptimized data transformations\u2014inside its <code>handle_call/3</code> callback, it cannot process subsequent messages concurrently.</p><p>As inbound message rates outpace message consumption, the process mailbox grows unbounded. The head-of-line blocking compounds across all callers: requests back up in the mailbox, causing each caller to sequentially hit the 5,000ms deadline and crash with <code>** (exit) exited in: GenServer.call(..., 5000) ** (EXIT) time out</code>. This triggers supervisor restarts and cascading service failures across the BEAM VM.</p>",
    "root_cause": "Bottlenecking a singleton GenServer by running blocking I/O synchronously within handle_call/3, causing unbounded mailbox queues and cascading caller timeouts.",
    "bad_code": "defmodule CoreApp.PaymentProcessor do\n  use GenServer\n\n  def process_transaction(pid, transaction_data) do\n    # Default 5000ms synchronous call\n    GenServer.call(pid, {:process, transaction_data})\n  end\n\n  def handle_call({:process, transaction_data}, _from, state) do\n    # Synchronous HTTP call directly inside the GenServer process loop\n    case HTTPoison.post(\"https://payment.gateway/v1/charge\", Jason.encode!(transaction_data)) do\n      {:ok, %{status_code: 200, body: body}} ->\n        {:reply, {:ok, Jason.decode!(body)}, state}\n      {:error, reason} ->\n        {:reply, {:error, reason}, state}\n    end\n  end\nend",
    "solution_desc": "Decouple synchronous request coordination from execution by offloading long-running tasks to an asynchronous task supervisor or worker pool. Retain the caller's reference (<code>from</code>), reply asynchronously using <code>GenServer.reply/2</code> from within a supervised Task, and return <code>{:noreply, state}</code> immediately in <code>handle_call/3</code> to keep the GenServer mailbox empty.",
    "good_code": "defmodule CoreApp.PaymentProcessor do\n  use GenServer\n\n  def start_link(opts) do\n    GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n  end\n\n  def process_transaction(transaction_data, timeout \\\\ 10_000) do\n    GenServer.call(__MODULE__, {:process, transaction_data}, timeout)\n  end\n\n  def init(state) do\n    {:ok, state}\n  end\n\n  def handle_call({:process, transaction_data}, from, state) do\n    # Spawn an asynchronous unlinked supervised Task\n    Task.Supervisor.start_child(CoreApp.PaymentTaskSupervisor, fn ->\n      result = \n        case Req.post(\"https://payment.gateway/v1/charge\", json: transaction_data) do\n          {:ok, %{status: 200, body: body}} -> {:ok, body}\n          {:error, reason} -> {:error, reason}\n        end\n      \n      # Respond to caller when task completes, bypassing the GenServer mailbox\n      GenServer.reply(from, result)\n    end)\n\n    # Free the GenServer immediately to process next mailbox message\n    {:noreply, state}\n  end\nend",
    "verification": "Query the process mailbox length using `:erlang.process_info(Process.whereis(CoreApp.PaymentProcessor), :message_queue_len)`. Under continuous synthetic load, the message queue length should remain near zero.",
    "date": "2026-09-24",
    "id": 1790216229,
    "type": "error"
});