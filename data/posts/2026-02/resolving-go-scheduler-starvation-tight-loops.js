window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "resolving-go-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "Runtime Starvation",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go, the runtime scheduler uses a cooperative-preemptive model. Before Go 1.14, loops without function calls could block a thread (M) indefinitely, preventing the scheduler from running other goroutines on that processor (P). While asynchronous preemption was introduced later, extremely tight computational loops\u2014especially those operating on large slices without allocation or function calls\u2014can still delay Garbage Collection (GC) STW phases and cause tail latency spikes in concurrent tasks.</p>",
    "root_cause": "The Go scheduler relies on stack-growth checks to preempt goroutines. Tight loops that do not call functions or trigger stack checks can hog the P, causing 'stop-the-world' events to wait indefinitely for the loop to reach a safe point.",
    "bad_code": "func heavyComputation(data []float64) {\n\tfor i := 0; i < len(data); i++ {\n\t\t// Tight loop with no function calls or I/O\n\t\tdata[i] = math.Sqrt(data[i]) * math.Pi\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() in long-running loops to yield control, or ensure the loop is broken into smaller chunks that allow for preemption points.",
    "good_code": "func heavyComputation(data []float64) {\n\tfor i := 0; i < len(data); i++ {\n\t\tdata[i] = math.Sqrt(data[i]) * math.Pi\n\t\t// Periodically yield to the scheduler\n\t\tif i%1000 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n}",
    "verification": "Run the code with GODEBUG=schedtrace=1000 and observe if any 'P' remains busy for significantly longer than others during GC cycles.",
    "date": "2026-02-26",
    "id": 1772068466,
    "type": "error"
});