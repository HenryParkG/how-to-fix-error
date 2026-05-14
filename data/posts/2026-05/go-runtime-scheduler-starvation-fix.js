window.onPostDataLoaded({
    "title": "Fixing Go Runtime Starvation in Preemption Loops",
    "slug": "go-runtime-scheduler-starvation-fix",
    "language": "Go",
    "code": "SchedulerStarvation",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler used cooperative preemption, meaning a goroutine would only yield at function calls. In later versions, non-cooperative preemption (using signals) was introduced, but tight loops with zero function calls or high-frequency memory allocation can still starve the scheduler of M:N mapping cycles, leading to high latency in GC or other goroutines.</p>",
    "root_cause": "A tight, long-running computational loop that does not contain function calls or preemption points, preventing the Go scheduler from context-switching.",
    "bad_code": "func heavyWork(data []int) {\n    for i := 0; i < len(data); i++ {\n        // Tight loop with no function calls\n        data[i] = data[i] * 2 / 3 + 1\n    }\n}",
    "solution_desc": "Use runtime.Gosched() to manually yield the processor or ensure the loop performs operations that trigger the scheduler's preemption points.",
    "good_code": "import \"runtime\"\n\nfunc heavyWork(data []int) {\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 2 / 3 + 1\n        // Manually yield every N iterations to prevent starvation\n        if i%1000 == 0 {\n            runtime.Gosched()\n        }\n    }\n}",
    "verification": "Run the code with GODEBUG=schedtrace=1000 to observe goroutine migration and scheduling latency.",
    "date": "2026-05-14",
    "id": 1778739393,
    "type": "error"
});