window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "go-runtime-scheduler-starvation-fix",
    "language": "Go",
    "code": "StarvationError",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Go's scheduler relies on preemption to ensure fair execution of goroutines. Before Go 1.14, the scheduler was purely cooperative, meaning it only preempted at function calls. In modern versions, even with asynchronous preemption, a tight CPU-bound loop that contains no function calls or system calls can still 'starve' the scheduler. This prevents other goroutines (like garbage collection or network polling) from running on that P (processor), leading to increased latency or even deadlocks in high-concurrency environments.</p>",
    "root_cause": "A tight loop that lacks function calls or preemption points prevents the Go runtime from sending a signal to the thread to yield control.",
    "bad_code": "func compute() {\n    // Tight loop with no preemption points\n    for i := 0; i < 1e10; i++ {\n        // Heavy calculation without function calls\n        _ = i * i\n    }\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() within the loop, or restructure the loop to include function calls which act as natural preemption points. Alternatively, leverage Go 1.14+'s asynchronous preemption by ensuring the loop doesn't block OS signals.",
    "good_code": "import \"runtime\"\n\nfunc compute() {\n    for i := 0; i < 1e10; i++ {\n        _ = i * i\n        // Explicitly yield every N iterations to prevent starvation\n        if i%1000000 == 0 {\n            runtime.Gosched()\n        }\n    }\n}",
    "verification": "Monitor scheduler latency using GODEBUG=schedtrace=1000 or profile with pprof to check for long-running goroutines without context switches.",
    "date": "2026-03-09",
    "id": 1773018967,
    "type": "error"
});