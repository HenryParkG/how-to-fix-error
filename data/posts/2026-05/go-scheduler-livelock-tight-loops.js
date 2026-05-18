window.onPostDataLoaded({
    "title": "Debugging Go Scheduler Livelock in Tight Loops",
    "slug": "go-scheduler-livelock-tight-loops",
    "language": "Go",
    "code": "GOMAXPROCS Starvation",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler used a cooperative preemption model. This meant that a goroutine could only be preempted if it made a function call, allowing the scheduler to hook into the stack growth check. However, in scenarios involving tight, non-preemptive loops (loops with no function calls), a goroutine could effectively 'livelock' a P (Processor), preventing other goroutines or even the Garbage Collector (GC) from running.</p><p>Even with the introduction of asynchronous preemption in Go 1.14+, highly optimized loops that manipulate memory directly can sometimes bypass the signal-based preemption triggers if the OS signals are blocked or if the loop executes faster than the preemptive signal's resolution, leading to significant tail latency.</p>",
    "root_cause": "The Go scheduler fails to regain control of a thread because the running goroutine does not reach a preemption point (stack check) and ignores or delays asynchronous preemption signals during heavy CPU-bound computation.",
    "bad_code": "func computeSum(data []int) int {\n    sum := 0\n    // Tight loop with no function calls can starve the scheduler\n    for i := 0; i < len(data); i++ {\n        sum += data[i]\n    }\n    return sum\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() in long-running loops or ensure the Go version is 1.14+ and the loop structure allows for signal-based preemption. For extreme performance cases, break the loop into smaller chunks processed by different goroutines to ensure the GC can trigger a STW (Stop The World) event when necessary.",
    "good_code": "import \"runtime\"\n\nfunc computeSum(data []int) int {\n    sum := 0\n    for i := 0; i < len(data); i++ {\n        sum += data[i]\n        // Periodically yield control back to the scheduler\n        if i%1e6 == 0 {\n            runtime.Gosched()\n        }\n    }\n    return sum\n}",
    "verification": "Use 'GODEBUG=schedtrace=1000' to monitor scheduler activity and check if threads are being blocked for extended periods during the execution of the loop.",
    "date": "2026-05-18",
    "id": 1779106898,
    "type": "error"
});