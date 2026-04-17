window.onPostDataLoaded({
    "title": "Mitigating Go Runtime Scheduler Livelocks",
    "slug": "go-runtime-scheduler-livelock-mitigation",
    "language": "Go",
    "code": "GOMAXPROCS Hang",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Go's scheduler relies on execution 'safe points' to preempt goroutines. In versions prior to 1.14, a goroutine running a tight loop with no function calls could effectively hijack a processor (P), preventing other goroutines and even the Garbage Collector from running. While Go 1.14 introduced asynchronous preemption via signals, certain tight loops\u2014especially those performing intensive numerical computations or low-level memory operations\u2014can still delay preemption cycles, leading to increased tail latency or complete system livelocks in resource-constrained environments.</p>",
    "root_cause": "Tight loops without function calls or allocation points prevent the Go scheduler from inserting cooperative preemption points, leading to M/P starvation.",
    "bad_code": "func heavyComputation(data []float64) {\n    for i := 0; i < len(data); i++ {\n        // Tight loop with no function calls or I/O\n        data[i] = data[i] * 1.0001\n    }\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() inside the loop or refactor the code to ensure function calls (which contain stack guards) are present, allowing the runtime to preempt the goroutine during its stack-check phase.",
    "good_code": "import \"runtime\"\n\nfunc heavyComputation(data []float64) {\n    for i := 0; i < len(data); i++ {\n        data[i] = data[i] * 1.0001\n        if i%1000 == 0 {\n            runtime.Gosched() // Explicitly yield the processor\n        }\n    }\n}",
    "verification": "Run the code with GOMAXPROCS=1 and check if a secondary 'heartbeat' goroutine can still print to stdout during the computation.",
    "date": "2026-04-17",
    "id": 1776390359,
    "type": "error"
});