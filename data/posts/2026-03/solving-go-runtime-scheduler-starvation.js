window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "solving-go-runtime-scheduler-starvation",
    "language": "Go",
    "code": "GoroutineStarvation",
    "tags": [
        "Go",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler was primarily cooperative. Even with the introduction of asynchronous preemption, certain 'tight' loops that do not contain function calls can still hinder the scheduler's ability to preempt a long-running goroutine. This leads to 'starvation', where other goroutines are unable to be scheduled on the current P (processor), causing latency spikes and application hangs.</p><p>When a goroutine enters a computationally intensive loop without any yield points, the Go runtime cannot safely stop the goroutine to perform garbage collection or execute other tasks, effectively hijacking a thread of execution.</p>",
    "root_cause": "The Go runtime relies on stack-growth checks at function entries to trigger preemption. Tight loops without function calls bypass these checks.",
    "bad_code": "func computeSum() {\n    for i := 0; i < 1e15; i++ {\n        // No function calls, no yield points\n        res += i\n    }\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() in long-running loops or ensure the code is compatible with Go 1.14+ asynchronous preemption. For extremely performance-sensitive sections, breaking the loop into smaller chunks is preferred.",
    "good_code": "import \"runtime\"\n\nfunc computeSum() {\n    for i := 0; i < 1e15; i++ {\n        res += i\n        if i%1e6 == 0 {\n            runtime.Gosched() // Explicitly yield the processor\n        }\n    }\n}",
    "verification": "Use 'go tool trace' to visualize goroutine execution and ensure no single G is hogging a P for more than 10ms.",
    "date": "2026-03-21",
    "id": 1774085038,
    "type": "error"
});