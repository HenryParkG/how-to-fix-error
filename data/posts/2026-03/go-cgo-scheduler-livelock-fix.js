window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Livelocks in Cgo Loops",
    "slug": "go-cgo-scheduler-livelock-fix",
    "language": "Go",
    "code": "SchedulerLivelock",
    "tags": [
        "Go",
        "Concurrency",
        "Cgo",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go, the runtime scheduler relies on cooperative preemption. When execution enters a Cgo call, the Go runtime relinquishes the 'M' (machine thread) but keeps the 'P' (processor) assigned if possible. However, if the C code enters a tight, long-running loop without returning to Go or performing a blocking system call that Go's 'sysmon' can detect, the scheduler cannot preempt the goroutine. This effectively pins a CPU core to a non-preemptible task, leading to starvation of other goroutines and potential livelocks in high-concurrency environments.</p>",
    "root_cause": "The Go scheduler cannot inject async preemption points into compiled C code. If a C function runs indefinitely without yielding, the P remains locked to that M.",
    "bad_code": "// C code (bridge.c)\nvoid heavy_computation() {\n    while(1) { // Tight loop with no I/O or yielding\n        do_work();\n    }\n}\n\n// Go code\n/* #include \"bridge.h\" */\nimport \"C\"\nfunc RunWorker() {\n    C.heavy_computation() // Blocks the P indefinitely\n}",
    "solution_desc": "Break the C execution into chunks and return control to Go periodically, or use a separate OS thread with 'runtime.LockOSThread' if necessary. The preferred way is to invoke the C function in a loop that allows Go's scheduler to see the function return.",
    "good_code": "// C code (bridge.c)\nint partial_work(int iterations) {\n    for(int i=0; i<iterations; i++) { do_work(); }\n    return is_done;\n}\n\n// Go code\nfunc RunWorker() {\n    for {\n        done := C.partial_work(1000)\n        if done != 0 { break }\n        runtime.Gosched() // Explicitly yield to allow other goroutines to run\n    }\n}",
    "verification": "Use 'GOMAXPROCS=1' and run a concurrent HTTP server alongside the task. If the server responds, the scheduler is successfully yielding.",
    "date": "2026-03-12",
    "id": 1773308083,
    "type": "error"
});