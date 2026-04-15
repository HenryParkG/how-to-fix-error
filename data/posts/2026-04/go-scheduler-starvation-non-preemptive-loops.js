window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Non-Preemptive Loops",
    "slug": "go-scheduler-starvation-non-preemptive-loops",
    "language": "Go",
    "code": "Runtime Starvation",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go, the scheduler (G-M-P model) relies on goroutines reaching a 'safepoint' (usually a function call) to yield control. In high-performance computational scenarios, a tight loop with no function calls can monopolize a processor (P), preventing the garbage collector from reaching a STW (Stop The World) state and blocking other goroutines.</p>",
    "root_cause": "Computational loops without function calls or system calls prevent the Go 1.13 and earlier cooperative scheduler from preempting the goroutine. While Go 1.14+ introduced asynchronous preemption via signals (SIGURG), certain tight loops or OS-level constraints can still cause 'scheduler starvation' or long GC pauses.",
    "bad_code": "func heavyComputation(data []float64) {\n    for i := 0; i < len(data); i++ {\n        // Tight loop with no function calls\n        data[i] = data[i] * 1.0001 / 0.999\n        // This can block GC and other goroutines on this P\n    }\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() to yield control, or ensure the loop is broken into smaller chunks that allow the Go runtime to perform asynchronous preemption at signal points.",
    "good_code": "func heavyComputation(data []float64) {\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 1.0001 / 0.999\n        // Yield every N iterations to allow scheduler/GC intervention\n        if i%1000 == 0 {\n            runtime.Gosched()\n        }\n    }\n}",
    "verification": "Run the application with GODEBUG=schedtrace=1000 and observe if any 'P' remains busy for excessive durations without context switching.",
    "date": "2026-04-15",
    "id": 1776230155,
    "type": "error"
});