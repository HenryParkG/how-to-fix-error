window.onPostDataLoaded({
    "title": "Resolving Go Scheduler Starvation in CPU-Bound Loops",
    "slug": "go-runtime-scheduler-starvation-fix",
    "language": "Go",
    "code": "RuntimeStarvation",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler relied strictly on cooperative preemption, meaning a goroutine had to reach a function call to be descheduled. In modern Go, while non-cooperative preemption exists via signals, tight CPU-bound loops that perform heavy calculations without function calls can still saturate the P (Processor) and prevent the garbage collector or other goroutines from running, leading to significant tail latency or application hangs.</p>",
    "root_cause": "A tight loop with no function calls or preemption points prevents the Go runtime from injecting a stack growth check, which is where cooperative preemption normally occurs.",
    "bad_code": "func heavyCalc(data []float64) {\n\tfor i := 0; i < len(data); i++ {\n\t\t// Tight loop with no function calls\n\t\tdata[i] = data[i] * 1.000001 / 0.99999\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() or ensure the loop is broken into smaller chunks that allow for signal-based preemption to take effect. In Go 1.14+, this is less frequent but assembly loops or OS-thread-locked code still require manual yielding.",
    "good_code": "func heavyCalc(data []float64) {\n\tfor i := 0; i < len(data); i++ {\n\t\tif i%1000 == 0 {\n\t\t\truntime.Gosched() // Explicitly yield to scheduler\n\t\t}\n\t\tdata[i] = data[i] * 1.000001 / 0.99999\n\t}\n}",
    "verification": "Run the code with GOMAXPROCS=1 and a concurrent monitoring goroutine. If the monitor prints consistently, preemption is working.",
    "date": "2026-04-04",
    "id": 1775285401,
    "type": "error"
});