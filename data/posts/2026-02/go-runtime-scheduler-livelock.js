window.onPostDataLoaded({
    "title": "Fixing Go Runtime Scheduler Livelocks",
    "slug": "go-runtime-scheduler-livelock",
    "language": "Go",
    "code": "SchedulerStarvation",
    "tags": [
        "Go",
        "Runtime",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Go's scheduler relies on points of cooperation to preempt goroutines. In older versions or specific edge cases in modern Go (like tight loops without function calls), a CPU-bound goroutine can monopolize a processor (P). This prevents the Garbage Collector (GC) from reaching a STW (Stop-The-World) state or stops other goroutines from being scheduled on that thread, leading to a system-wide livelock.</p>",
    "root_cause": "Tight, non-preemptive loops that do not contain function calls, preventing the Go runtime from injecting preemption points.",
    "bad_code": "func compute() {\n    for {\n        // Tight loop with no function calls\n        i++ \n    }\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() or ensure the loop performs a function call/IO operation that triggers the scheduler's preemption logic.",
    "good_code": "func compute() {\n    for {\n        i++\n        if i%1000 == 0 {\n            runtime.Gosched() // Yield processor\n        }\n    }\n}",
    "verification": "Run the code with GOMAXPROCS=1 and verify that other goroutines still execute concurrently.",
    "date": "2026-02-23",
    "id": 1771822401,
    "type": "error"
});