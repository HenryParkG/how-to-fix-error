window.onPostDataLoaded({
    "title": "Mitigating Elixir OTP Process Mailbox Bloat",
    "slug": "elixir-otp-mailbox-bloat",
    "language": "Elixir",
    "code": "MailboxBloat",
    "tags": [
        "Elixir",
        "OTP",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In Elixir, processes communicate via asynchronous message passing. If a producer sends messages faster than a GenServer can process them, the 'mailbox' (message queue) grows indefinitely. This consumes RAM and eventually leads to the BEAM VM crashing with an Out Of Memory (OOM) error.</p><p>Furthermore, using selective receive (matching specific patterns) can leave unmatched messages in the mailbox, forcing the VM to scan thousands of messages every time a new message arrives, leading to a CPU death spiral.</p>",
    "root_cause": "Lack of backpressure mechanisms and the accumulation of unmatched messages in the process mailbox.",
    "bad_code": "def handle_info({:work, data}, state) {\n  # No limit on incoming messages\n  heavy_compute(data)\n  {:noreply, state}\n}\n# Missing catch-all handle_info causes selective receive lag",
    "solution_desc": "Implement a 'catch-all' handle_info to discard unexpected messages and use GenStage or a producer-consumer pattern with manual acknowledgments for backpressure.",
    "good_code": "def handle_info({:work, data}, state) {\n  heavy_compute(data)\n  {:noreply, state}\n}\n\ndef handle_info(_unexpected, state) {\n  # Prevent mailbox bloat from unmatched messages\n  {:noreply, state}\n}",
    "verification": "Run :observer.start() and monitor the 'Message Queue' length for individual processes under high load.",
    "date": "2026-04-11",
    "id": 1775882980,
    "type": "error"
});