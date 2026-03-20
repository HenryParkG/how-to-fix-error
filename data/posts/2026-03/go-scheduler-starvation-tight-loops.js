window.onPostDataLoaded({
    "title": "Fix Go Scheduler Starvation in Tight Loops",
    "slug": "go-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "RuntimeStarvation",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the runtime scheduler used cooperative preemption, meaning a goroutine could only be context-switched at specific points like function calls or channel operations. Even in 1.14+, which introduced asynchronous preemption using OS signals, extremely tight loops containing no function calls or memory allocations can still cause 'starvation'.</p><p>When a goroutine enters such a loop, it may occupy a Processor (P) indefinitely, preventing the scheduler from running other goroutines on that M (machine thread). This manifests as increased latency for other tasks or even a complete hang of the application if all available Ps are occupied by tight loops.</p>",
    "root_cause": "The scheduler's inability to find a safe point to preempt the goroutine because the loop lacks function calls, stack growth checks, or yield points.",
    "bad_code": "func heavyComputation(data []float64) {\n    // Tight loop with no function calls\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 1.000001\n        // No function calls here; scheduler might struggle to preempt\n    }\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() to yield the processor, or ensure the loop is broken into chunks that allow the runtime's asynchronous preemption signals to be processed correctly.",
    "good_code": "import \"runtime\"\n\nfunc heavyComputation(data []float64) {\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 1.000001\n        // Explicitly yield every N iterations or rely on async preemption in 1.14+\n        if i%1000000 == 0 {\n            runtime.Gosched()\n        }\n    }\n}",
    "verification": "Use 'GODEBUG=schedtrace=1000' to monitor scheduler stats. Verify that no goroutine stays on a processor (P) for an excessive amount of time.",
    "date": "2026-03-20",
    "id": 1773981767,
    "type": "error"
});