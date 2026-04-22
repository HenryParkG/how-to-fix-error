window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "go-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "GoroutineStarvation",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, or in modern versions with specific tight-loop configurations, the scheduler can suffer from 'starvation'. This occurs because the Go scheduler is cooperatively preemptive at function calls. If a goroutine enters a heavy computational loop without any function calls, it never yields the Processor (P), preventing other goroutines or even the Garbage Collector (GC) from running.</p>",
    "root_cause": "The Go compiler failed to insert a preemption point in a loop that was non-inlined and lacked function calls, leading to a monopolized P.",
    "bad_code": "func heavyWork() {\n    for i := 0; i < 1e10; i++ {\n        // Tight loop with no function calls\n        // The scheduler cannot interrupt this\n        count++\n    }\n}",
    "solution_desc": "Manually invoke the scheduler yield or ensure the loop contains a preemption point. In modern Go (1.14+), asynchronous preemption usually handles this via signals, but in critical real-time or WASM contexts, manual yielding is still preferred.",
    "good_code": "func heavyWork() {\n    for i := 0; i < 1e10; i++ {\n        if i%1000 == 0 {\n            runtime.Gosched() // Explicitly yield the processor\n        }\n        count++\n    }\n}",
    "verification": "Run the program with GOMAXPROCS=1. If other goroutines execute during the loop, starvation is resolved.",
    "date": "2026-04-22",
    "id": 1776835083,
    "type": "error"
});