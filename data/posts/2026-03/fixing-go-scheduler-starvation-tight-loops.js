window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Runtime Loops",
    "slug": "fixing-go-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "SchedulerStarvation",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go's G-M-P concurrency model, the scheduler relies on execution 'checkpoints' to preempt long-running goroutines. While Go 1.14+ introduced asynchronous preemption using SIGURG signals, certain tight loops\u2014especially those performing intensive numerical calculations without function calls or memory allocations\u2014can still effectively starve the scheduler. This prevents other goroutines from being scheduled on that specific P (Processor), leading to tail latency spikes and application 'freezing' behavior in high-throughput systems.</p>",
    "root_cause": "The Go compiler may fail to insert a preemption point in tight loops that do not perform function calls, causing a single Goroutine to hog a thread (M) and its associated processor (P) indefinitely.",
    "bad_code": "func heavyComputation(data []int) {\n    // Tight loop with no function calls can cause starvation\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 2 / 3 + 42\n    }\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() or refactor the loop to include a function call, which forces the compiler to insert a stack guard check used for preemption.",
    "good_code": "import \"runtime\"\n\nfunc heavyComputation(data []int) {\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 2 / 3 + 42\n        // Explicitly yield the processor every N iterations\n        if i%1000 == 0 {\n            runtime.Gosched()\n        }\n    }\n}",
    "verification": "Use the GODEBUG=schedtrace=1000 environment variable to monitor if goroutines are being stuck on a single P for long durations.",
    "date": "2026-03-02",
    "id": 1772433947,
    "type": "error"
});