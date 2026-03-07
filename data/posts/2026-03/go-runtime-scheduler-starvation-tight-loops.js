window.onPostDataLoaded({
    "title": "Fixing Go Runtime Scheduler Starvation",
    "slug": "go-runtime-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "GoroutineStarvation",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Go's cooperative-leaning scheduler can suffer from starvation when a goroutine enters a tight, non-preemptive loop. If the loop contains no function calls (which act as yield points), the scheduler cannot context-switch that goroutine out, effectively 'hijacking' the processor thread and blocking other goroutines or GC tasks.</p>",
    "root_cause": "Tight loops in code that do not trigger the stack growth check or have been optimized by the compiler to exclude preemption points.",
    "bad_code": "func heavyWork() {\n    for i := 0; i < 1e15; i++ {\n        // No function calls, no I/O, no channels\n        counter++\n    }\n}",
    "solution_desc": "Manually invoke the scheduler using <code>runtime.Gosched()</code> or upgrade to Go 1.14+ which supports asynchronous preemption via signal-based interrupts.",
    "good_code": "import \"runtime\"\n\nfunc heavyWork() {\n    for i := 0; i < 1e15; i++ {\n        counter++\n        if i%1000000 == 0 {\n            runtime.Gosched() // Explicitly yield to other goroutines\n        }\n    }\n}",
    "verification": "Test with GOMAXPROCS=1 and ensure that concurrent goroutines (e.g., a simple logger) still execute during the heavy loop.",
    "date": "2026-03-07",
    "id": 1772864961,
    "type": "error"
});