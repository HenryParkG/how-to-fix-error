window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Livelocks in Non-Preemptible Loops",
    "slug": "go-scheduler-livelock-tight-loops",
    "language": "Go",
    "code": "GOSCHED-001",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Go's concurrency model, the scheduler traditionally relied on cooperative preemption during function calls (stack checks). In specific scenarios involving tight, computation-heavy loops without function calls, a goroutine can monopolize a logical processor (P), preventing the Go scheduler from preempting it for garbage collection (GC) or other goroutines.</p><p>While Go 1.14+ introduced asynchronous preemption via OS signals (SIGURG), certain edge cases\u2014such as tight loops on architectures with limited signal support or code compiled with specific flags\u2014can still cause 'livelocks' where the system appears frozen while one core hits 100% utilization.</p>",
    "root_cause": "The Go scheduler cannot find a safe point to preempt a goroutine that is executing a loop without function calls or I/O, leading to 'STW' (Stop The World) latency spikes during GC.",
    "bad_code": "func compute() {\n\tfor i := 0; i < 1e10; i++ {\n\t\t// Tight loop with no function calls\n\t\t// This can block GC and other goroutines on this P\n\t\ttotal += i\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() to yield the processor, or ensure the loop contains a preemptible operation. In modern Go, ensure your environment supports asynchronous preemption, but for critical tight loops, explicit yielding remains a robust defensive pattern.",
    "good_code": "import \"runtime\"\n\nfunc compute() {\n\tfor i := 0; i < 1e10; i++ {\n\t\ttotal += i\n\t\tif i%1e6 == 0 {\n\t\t\t// Manually yield to allow other goroutines and GC to run\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n}",
    "verification": "Run the code with GODEBUG=schedtrace=1000 and monitor if other goroutines are being starved or if GC 'sweep termination' takes an excessive amount of time.",
    "date": "2026-05-01",
    "id": 1777623410,
    "type": "error"
});