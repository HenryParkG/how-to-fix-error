window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "go-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "Runtime Starvation",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go's runtime, the scheduler manages goroutines using a cooperative-to-preemptive model. Before Go 1.14, the scheduler relied strictly on function calls to trigger preemption. In scenarios involving tight, non-preemptive loops (e.g., heavy mathematical computations), a single goroutine could hog a Processor (P), preventing the Sysmon thread from rescheduling other waiting goroutines. While Go 1.14 introduced asynchronous preemption via signals, certain architectures or specific loop structures can still lead to 'Starvation', where other goroutines (including the Garbage Collector) are delayed indefinitely.</p>",
    "root_cause": "The tight loop lacks function calls or yield points, and either asynchronous preemption is disabled or the loop is executing in a context where signal-based preemption is blocked.",
    "bad_code": "func heavyComputation() {\n\tfor i := 0; i >= 0; i++ {\n\t\t// Tight loop with no function calls\n\t\t// Before Go 1.14, this blocks the P forever\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() to yield control, or ensure the Go version is 1.14+ to leverage asynchronous preemption. For maximum safety in high-performance computing, restructuring loops to allow periodic yields is recommended.",
    "good_code": "func heavyComputation() {\n\tfor i := 0; i >= 0; i++ {\n\t\t// Periodically yield control\n\t\tif i%1000000 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n}",
    "verification": "Run the code with GOMAXPROCS=1 and attempt to execute a concurrent goroutine; if the second goroutine prints output, starvation is resolved.",
    "date": "2026-04-01",
    "id": 1775020695,
    "type": "error"
});