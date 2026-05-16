window.onPostDataLoaded({
    "title": "Mitigating Go Scheduler Latency in Tight Loops",
    "slug": "go-scheduler-latency-asynchronous-preemption",
    "language": "Go",
    "code": "Runtime Latency",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Go's scheduler uses a cooperative model where goroutines are expected to yield control. Historically, a 'tight loop' (a loop containing no function calls) could monopolize a Processor (P), preventing the garbage collector (GC) from reaching a STW (Stop-The-World) checkpoint or starving other goroutines.</p><p>While Go 1.14 introduced asynchronous preemption using OS signals, certain edge cases in low-level system code or high-performance compute loops can still trigger significant tail latency if the signal handling overhead is high or if the loop is non-preemptible by the compiler's safety checks.</p>",
    "root_cause": "The Go compiler fails to insert a stack guard check in loops that it deems 'tight' or leaf-like, meaning the scheduler cannot safely interrupt the execution context without an external signal.",
    "bad_code": "func heavyCompute(data []int) {\n    for i := 0; i < len(data); i++ {\n        // Tight loop with no function calls\n        data[i] = data[i] * 2 / 3\n    }\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() in long-running loops or ensure the Go version is 1.14+ where the runtime uses SIGURG signals to preempt threads asynchronously.",
    "good_code": "func heavyCompute(data []int) {\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 2 / 3\n        if i%1000 == 0 {\n            runtime.Gosched() // Explicitly yield for scheduler\n        }\n    }\n}",
    "verification": "Run the application with 'GODEBUG=schedtrace=1000' and monitor for P's that are locked for more than 10ms.",
    "date": "2026-05-16",
    "id": 1778926072,
    "type": "error"
});