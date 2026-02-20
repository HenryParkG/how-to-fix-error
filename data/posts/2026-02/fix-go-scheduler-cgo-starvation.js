window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight CGO Loops",
    "slug": "fix-go-scheduler-cgo-starvation",
    "language": "Go",
    "code": "Runtime Starvation",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>When a Goroutine enters a CGO call, the Go runtime relinquishes control of the OS thread (M) to the C code. While the runtime marks this thread as 'in syscall', a tight loop in CGO that executes frequently\u2014but for very short durations\u2014can prevent the Go scheduler from preempting the Goroutine. This leads to 'scheduler starvation' where other Goroutines on the same P (Processor) are blocked from executing, causing latency spikes and decreased throughput.</p>",
    "root_cause": "The Go scheduler relies on cooperative preemption points (like function calls or I/O). In a tight loop calling CGO, the transition between Go and C happens so fast that the background sysmon thread may not detect a long-running syscall, yet the Goroutine never reaches a Go-land preemption point to allow other tasks to run.",
    "bad_code": "package main\n\n/*\n#include <unistd.h>\nvoid fast_c_call() {}\n*/\nimport \"C\"\n\nfunc main() {\n    // This tight loop can starve the scheduler\n    for {\n        C.fast_c_call()\n    }\n}",
    "solution_desc": "To fix this, manually invoke the Go scheduler using runtime.Gosched() within the loop to yield the processor. Alternatively, if the C code is computationally expensive and long-running, use runtime.LockOSThread() to ensure the Goroutine stays on its own dedicated thread, or move the logic into a separate worker pool to avoid saturating the primary execution context.",
    "good_code": "package main\n\nimport (\n    \"runtime\"\n)\n\n/*\n#include <unistd.h>\nvoid fast_c_call() {}\n*/\nimport \"C\"\n\nfunc main() {\n    for {\n        C.fast_c_call()\n        // Explicitly yield to let other goroutines run\n        runtime.Gosched()\n    }\n}",
    "verification": "Use 'go tool trace' to visualize processor utilization. If starvation occurs, you will see long gaps in P utilization despite active Goroutines. After the fix, P utilization should show more frequent context switching.",
    "date": "2026-02-20",
    "id": 1771580108,
    "type": "error"
});