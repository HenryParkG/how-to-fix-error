window.onPostDataLoaded({
    "title": "Fix Go Scheduler Preemption Starvation in Cgo-Bound Hot Loops",
    "slug": "fix-go-scheduler-preemption-starvation-cgo-hot-loops",
    "language": "Go / C",
    "code": "GoSchedulerStarvation",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Cgo",
        "Error Fix"
    ],
    "analysis": "<p>When executing compute-heavy loops inside C extensions called via Cgo, the Go runtime can lose its ability to preempt running goroutines if the C loop does not yield control or invoke Go callbacks. In workloads running concurrent tasks alongside Cgo operations, this causes severe tail-latency spikes, garbage collection STW (Stop-The-World) delays, and thread starvation on available P (Processor) structures.</p><p>Go's asynchronous preemption mechanism uses OS signals (such as SIGURG) to pause running goroutines at safe points. However, when an OS thread (M) enters C code, Go context switching is suspended on that thread, preventing the Go scheduler from preempting the executing routine until execution returns to Go.</p>",
    "root_cause": "The Go runtime treats Cgo calls as external blocking operations. While the thread is executing within C, it runs outside the Go runtime scheduler bounds. Unchecked, long-running C hot loops block GC marking phases and hold onto Go scheduling slots without reaching preemption safe points.",
    "bad_code": "package main\n\n/*\n#include <stdint.h>\nvoid compute_hot_loop(uint64_t iterations) {\n    for (uint64_t i = 0; i < iterations; i++) {\n        // Heavy compute loop without syscalls or Go yield\n    }\n}\n*/\nimport \"C\"\n\nfunc ProcessData(iterations uint64) {\n    // Executes on OS thread; blocks Go preemption for the entire duration\n    C.compute_hot_loop(C.uint64_t(iterations))\n}",
    "solution_desc": "Architecturally resolve starvation by chunking the execution batch in Go and yielding execution periodically using runtime.Gosched(), or by implementing a C callback system that explicitly yields control back to the Go scheduler during long compute cycles.",
    "good_code": "package main\n\n/*\n#include <stdint.h>\nvoid compute_chunk(uint64_t start, uint64_t count) {\n    for (uint64_t i = start; i < start + count; i++) {\n        // Heavy compute loop iteration chunk\n    }\n}\n*/\nimport \"C\"\nimport \"runtime\"\n\nfunc ProcessDataChunked(total uint64, chunkSize uint64) {\n    for i := uint64(0); i < total; i += chunkSize {\n        count := chunkSize\n        if i+count > total {\n            count = total - i\n        }\n        // Run short execution bound chunk in Cgo\n        C.compute_chunk(C.uint64_t(i), C.uint64_t(count))\n        // Explicitly yield to allow Go scheduler and GC safe-points\n        runtime.Gosched()\n    }\n}",
    "verification": "Monitor GC latency and scheduler trace metrics by setting `GODEBUG=schedtrace=1000,scheddetail=1` alongside `GODEBUG=gctrace=1`. Verify that goroutines yield execution within expected windows and GC Stop-The-World pause durations remain within target SLA limits.",
    "date": "2026-07-28",
    "id": 1785226488,
    "type": "error"
});