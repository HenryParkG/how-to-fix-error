window.onPostDataLoaded({
    "title": "Resolving Go Scheduler Livelocks in Tight Loops",
    "slug": "go-scheduler-livelock-tight-loops",
    "language": "Go",
    "code": "StarvationError",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler relied purely on cooperative preemption. If a goroutine entered a 'tight' loop containing no function calls, it would never trigger a stack growth check, effectively hijacking the Processor (P). Even with the introduction of asynchronous preemption in Go 1.14+, high-frequency tight loops that manipulate memory without yielding can still lead to GC stalls and scheduler latency, as the signal-based preemption might be delayed or blocked by certain atomic operations or syscalls.</p>",
    "root_cause": "The Go scheduler cannot preempt a goroutine that does not make function calls or reach a safepoint, causing other goroutines on the same P to starve.",
    "bad_code": "func busyLoop(done chan bool) {\n\tfor {\n\t\t// Tight loop with no function calls\n\t\t// Before Go 1.14, this hangs the P forever\n\t\ti++\n\t}\n\tdone <- true\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() to yield execution, or ensure the loop performs an operation that triggers a safepoint (like a function call or I/O). In modern Go, ensure the loop isn't blocking OS signals if relying on async preemption.",
    "good_code": "func busyLoop(done chan bool) {\n\tfor {\n\t\ti++\n\t\t// Cooperative yield to let other goroutines run\n\t\tif i%1000 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n\tdone <- true\n}",
    "verification": "Run the code with GOMAXPROCS=1. If the program terminates or other goroutines execute, the livelock is resolved.",
    "date": "2026-03-11",
    "id": 1773203297,
    "type": "error"
});