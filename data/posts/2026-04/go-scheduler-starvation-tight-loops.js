window.onPostDataLoaded({
    "title": "Resolving Go Runtime Scheduler Starvation in Tight Loops",
    "slug": "go-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "Starvation",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler was primarily cooperative, meaning a goroutine had to reach a 'safe point' (like a function call or channel operation) to be preempted. In modern Go, while asynchronous preemption exists, tight CPU-bound loops that perform heavy arithmetic or memory manipulation without function calls can still lead to scheduler starvation. This manifests as other goroutines being unable to run, leading to high latency or deadlocks in single-core or low-GOMAXPROCS environments.</p>",
    "root_cause": "The Go scheduler relies on stack-checks to trigger preemption. A tight loop with no function calls may never trigger a stack check, preventing the scheduler from context-switching the CPU-hogging goroutine.",
    "bad_code": "func heavyComputation(data []int) {\n\tfor i := 0; i < len(data); i++ {\n\t\t// Tight loop with no function calls\n\t\tdata[i] = data[i] * data[i] % 777\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() within the loop to yield control, or ensure the Go version is 1.14+ where asynchronous preemption is supported via signals (though signals can still be blocked in specific syscall scenarios).",
    "good_code": "import \"runtime\"\n\nfunc heavyComputation(data []int) {\n\tfor i := 0; i < len(data); i++ {\n\t\tdata[i] = data[i] * data[i] % 777\n\t\t// Yield processor every N iterations\n\t\tif i%1000 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n}",
    "verification": "Run the code with GOMAXPROCS=1 and attempt to trigger a concurrent log operation. If the log appears, preemption is successful.",
    "date": "2026-04-18",
    "id": 1776495442,
    "type": "error"
});