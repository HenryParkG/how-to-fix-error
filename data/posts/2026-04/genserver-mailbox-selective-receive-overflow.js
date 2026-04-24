window.onPostDataLoaded({
    "title": "Resolving GenServer Mailbox Overflow under High-Throughput",
    "slug": "genserver-mailbox-selective-receive-overflow",
    "language": "Elixir",
    "code": "ResourceExhaustion",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Erlang and Elixir, the GenServer abstraction handles messages sequentially. A performance bottleneck arises when using selective receives (matching specific message patterns) while the mailbox contains thousands of unrelated messages. The BEAM VM must scan the entire mailbox linearly to find a match. Under high throughput, the cost of scanning grows $O(N)$, causing the process to lag, which in turn causes the mailbox to grow even faster, eventually leading to an Out-Of-Memory (OOM) crash.</p><p>This is often seen when developers use custom `receive` blocks inside a GenServer instead of relying on the standard `handle_info/2` callbacks, or when they fail to handle unexpected message types, leaving them to accumulate indefinitely in the mailbox.</p>",
    "root_cause": "The O(N) mailbox scanning cost of selective receive patterns when the process cannot keep up with the incoming message rate.",
    "bad_code": "def handle_info(:start_task, state) {\n  receive do\n    {:specific_event, data} -> process(data)\n  after\n    5000 -> :timeout\n  end\n  {:noreply, state}\n}",
    "solution_desc": "Never use manual 'receive' blocks inside a GenServer. Use 'handle_info' to process all messages and maintain an internal buffer or state machine to handle out-of-order logic. This ensures the mailbox is always drained at O(1).",
    "good_code": "def handle_info({:specific_event, data}, state) {\n  process(data)\n  {:noreply, state}\n}\n\ndef handle_info(_unexpected, state) {\n  # Always drain unknown messages to prevent overflow\n  {:noreply, state}\n}",
    "verification": "Monitor process mailbox size using :erlang.process_info(pid, :message_queue_len) and ensure it remains stable under peak load.",
    "date": "2026-04-24",
    "id": 1776995320,
    "type": "error"
});