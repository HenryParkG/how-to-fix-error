window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "go-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "GoroutineStarvation",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler was primarily cooperative, meaning preemption only occurred at function calls. In high-performance computing scenarios where a goroutine runs a tight, CPU-bound loop without function calls (e.g., intensive math), that goroutine could effectively 'hijack' a processor (P). This prevents the Go runtime from scheduling other goroutines on that M (machine/thread), leading to application-wide latency and starvation of background tasks like GC or timers.</p>",
    "root_cause": "The Go scheduler historically relied on stack-check points at function entries to trigger preemption. Tight loops without function calls bypass these checks.",
    "bad_code": "func heavyWork(data []int) {\n    for i := 0; i < len(data); i++ {\n        // Tight loop with no function calls\n        data[i] = data[i] * 2 / 3 + 42\n    }\n}",
    "solution_desc": "Upgrade to Go 1.14+ to benefit from asynchronous preemption based on OS signals (SIGURG). For older versions or edge cases where signals are blocked, manually yield control using runtime.Gosched().",
    "good_code": "func heavyWork(data []int) {\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 2 / 3 + 42\n        if i%1000 == 0 {\n            runtime.Gosched() // Manually yield for older Go versions\n        }\n    }\n}",
    "verification": "Use 'go tool trace' to inspect goroutine scheduling. Verify that the M is not locked to a single G for the entire loop duration.",
    "date": "2026-04-10",
    "id": 1775784534,
    "type": "error"
});