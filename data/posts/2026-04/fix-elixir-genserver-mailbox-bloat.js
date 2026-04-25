window.onPostDataLoaded({
    "title": "Fixing Elixir GenServer Mailbox Bloat in Phoenix Channels",
    "slug": "fix-elixir-genserver-mailbox-bloat",
    "language": "Elixir",
    "code": "MailboxOverflow",
    "tags": [
        "Go",
        "Backend",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Phoenix applications, GenServers serving as channel subscribers can experience rapid memory growth. Because Erlang processes handle messages sequentially, a spike in broadcast traffic can cause the process mailbox to grow faster than it can be drained, eventually crashing the node due to OOM (Out of Memory).</p>",
    "root_cause": "Synchronous message processing within the GenServer process that blocks it from consuming the incoming message queue fast enough during peak broadcast periods.",
    "bad_code": "def handle_info({:broadcast, data}, state) do\n  # Blocking synchronous operation (e.g., DB write)\n  Repo.insert!(%Event{data: data})\n  {:noreply, state}\nend",
    "solution_desc": "Offload message processing to a separate task or use a buffer. Implementing a producer-consumer pattern with GenStage or simply spawning supervised tasks ensures the mailbox remains clear.",
    "good_code": "def handle_info({:broadcast, data}, state) do\n  # Offload to a Task to keep the mailbox empty\n  Task.Supervisor.start_child(MyApp.TaskSupervisor, fn -> \n    Repo.insert!(%Event{data: data})\n  end)\n  {:noreply, state}\nend",
    "verification": "Monitor process mailbox size using :erlang.process_info(pid, :message_queue_len) and ensure it stays near zero under load.",
    "date": "2026-04-25",
    "id": 1777110199,
    "type": "error"
});