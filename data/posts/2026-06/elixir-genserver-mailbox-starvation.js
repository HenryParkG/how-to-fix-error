window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Bottlenecks",
    "slug": "elixir-genserver-mailbox-starvation",
    "language": "Elixir",
    "code": "GenServerMailboxBottleneck",
    "tags": [
        "Docker",
        "Elixir",
        "Erlang",
        "GenServer",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir and Erlang (BEAM) systems, each GenServer process contains a single sequential mailbox queue. Under heavy load, if a GenServer takes a long time to handle individual messages (e.g., executing synchronous third-party HTTP requests, writing to a database, or performing heavy serialization), incoming messages accumulate in the process mailbox. This dynamic causes memory usage to surge exponentially (OOM), increases caller timeouts, and starves vital system processes, defeating the fault-tolerant advantages of actor architectures.</p>",
    "root_cause": "Blocking operations (like network requests or disk I/O) executed inside the main GenServer message-processing thread (`handle_call` / `handle_cast`). This blocks the single-threaded actor execution loop from consuming subsequent messages.",
    "bad_code": "defmodule HeavyWorker do\n  use GenServer\n\n  # BUGGY: Direct blocking execution inside execution loop\n  def handle_call({:process_data, data}, _from, state) do\n    # Sync HTTP request blocks the GenServer's single thread from digesting the queue\n    result = HTTPoison.post!(\"https://api.example.com/process\", Jason.encode!(data))\n    {:reply, {:ok, result.body}, state}\n  end\nend",
    "solution_desc": "Decouple synchronous execution from the message-receiving actor loop. Instead of executing blocking operations within the GenServer process thread, run them asynchronously inside a dynamic supervised task (`Task.Supervisor`). Reply to the client asynchronously once the processing task is completed, keeping the GenServer available to receive more incoming messages instantly.",
    "good_code": "defmodule HeavyWorker do\n  use GenServer\n\n  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n  def init(state), do: {:ok, state}\n\n  # FIX: Delegate blocking tasks to a dynamic task supervisor\n  def handle_call({:process_data, data}, from, state) do\n    Task.Supervisor.start_child(MyTaskSupervisor, fn ->\n      try do\n        result = HTTPoison.post!(\"https://api.example.com/process\", Jason.encode!(data))\n        # Reply to caller asynchronously using the saved 'from' coordinate\n        GenServer.reply(from, {:ok, result.body})\n      rescue\n        e -> GenServer.reply(from, {:error, e})\n      end\n    end)\n\n    # Instruct GenServer not to reply immediately to release the caller loop\n    {:noreply, state}\n  end\nend",
    "verification": "Inject load using a benchmark script spawning concurrent client calls. Monitor mailbox size in live production environments by executing `:erlang.process_info(pid, :message_queue_len)`. The queue length should remain near zero under load, and process-level memory footprint should remain completely stable.",
    "date": "2026-06-27",
    "id": 1782541367,
    "type": "error"
});