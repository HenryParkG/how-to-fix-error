window.onPostDataLoaded({
    "title": "Mitigating Go Scheduler Starvation in CPU-Bound Loops",
    "slug": "go-scheduler-starvation-cpu-loops",
    "language": "Go",
    "code": "Starvation",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Go, the scheduler uses a cooperative-preemptive model. Before Go 1.14, a goroutine performing a tight, long-running loop with no function calls could effectively 'starve' the scheduler because there were no safe-points for preemption. While Go 1.14 introduced asynchronous preemption using OS signals, certain high-performance compute scenarios or specific architectures can still experience latency spikes or deadlock-like behavior if the loop prevents the scheduler from executing background tasks like Garbage Collection (GC) mark-assist or network polling.</p>",
    "root_cause": "A tight loop that doesn't trigger function calls prevents the Go runtime from injecting preemption checks, potentially blocking the thread (M) from switching to other goroutines (G).",
    "bad_code": "func compute() {\n\tfor {\n\t\t// Tight loop with no function calls\n\t\t// This can block GC and other goroutines on older Go versions\n\t\t// or on specific architectures.\n\t\tval++\n\t}\n}",
    "solution_desc": "Manually introduce a preemption point using runtime.Gosched() or ensure the Go version is 1.14+ and the loop allows for asynchronous signal-based preemption. For heavy CPU tasks, it is better to break the work into chunks or use a worker pool to allow the scheduler to breathe.",
    "good_code": "func compute(ctx context.Context) {\n\tfor {\n\t\tselect {\n\t\tcase <-ctx.Done():\n\t\t\treturn\n\t\tdefault:\n\t\t\tval++\n\t\t\t// Manual yield to the scheduler\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n}",
    "verification": "Monitor execution using 'GODEBUG=schedtrace=1000' to ensure goroutines are being context-switched and GC pauses remain low.",
    "date": "2026-03-29",
    "id": 1774747641,
    "type": "error"
});