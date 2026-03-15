window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "go-scheduler-starvation-non-cooperative-preemption",
    "language": "Go",
    "code": "GoRuntimeError",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Go 1.14+, the runtime introduced non-cooperative preemption to prevent tight loops from hogging an OS thread (P). However, in specific scenarios involving intensive numerical computation or tight loops that lack function calls, the asynchronous preemption signal can fail to find a safe-point. This leads to scheduler starvation where other goroutines are unable to be scheduled on that specific processor.</p><p>The issue often manifests as high CPU usage coupled with unexplained latency spikes in other parts of the application, as the sysmon (system monitor) thread detects the long-running G but cannot effectively suspend it if the hardware or OS context doesn't support the signal injection at that specific instruction pointer.</p>",
    "root_cause": "A goroutine executing a tight loop without function calls or explicit yield points, preventing the Go scheduler's signal-based preemption from interrupting the execution flow.",
    "bad_code": "func heavyComputation(data []float64) {\n\tfor i := 0; i < len(data); i++ {\n\t\t// A very tight loop with no function calls\n\t\tdata[i] = data[i] * 1.0000001 / 0.999999\n\t\t// The scheduler might fail to preempt this G in certain environments\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() to create a cooperative yield point, or restructure the loop to include function calls which naturally act as preemption points (safe-points) in the Go runtime.",
    "good_code": "import \"runtime\"\n\nfunc heavyComputation(data []float64) {\n\tfor i := 0; i < len(data); i++ {\n\t\tdata[i] = data[i] * 1.0000001 / 0.999999\n\t\t// Explicitly yield every 1024 iterations to ensure fairness\n\t\tif i%1024 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n}",
    "verification": "Enable scheduler tracing with 'GODEBUG=schedtrace=1000' and verify that Gs are being moved between Ps during the heavy computation period.",
    "date": "2026-03-15",
    "id": 1773550811,
    "type": "error"
});