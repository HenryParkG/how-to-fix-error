window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "go-scheduler-starvation-preemption-fix",
    "language": "Go",
    "code": "RuntimeStarvation",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler was purely cooperative, meaning a goroutine would only yield if it made a function call. In modern Go, non-cooperative preemption exists but can still fail in extreme cases of tight loops involving heavy register usage or unsafe code where the compiler cannot insert stack checks. This leads to \"STW\" (Stop The World) latency spikes and prevents other goroutines from being scheduled on that specific P (Processor).</p>",
    "root_cause": "A tight computational loop without function calls or preemption points prevents the Go runtime from injecting an asynchronous preemption signal, effectively hijacking the thread.",
    "bad_code": "func heavyComputation(data []float64) {\n\tfor i := 0; i < len(data); i++ {\n\t\t// High-intensity math with no function calls\n\t\tdata[i] = math.Sqrt(data[i]) * math.Pi\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() within the loop or break the work into smaller chunks to allow the asynchronous preemption mechanism to trigger correctly.",
    "good_code": "func heavyComputation(data []float64) {\n\tfor i := 0; i < len(data); i++ {\n\t\tdata[i] = math.Sqrt(data[i]) * math.Pi\n\t\tif i%1000 == 0 {\n\t\t\truntime.Gosched() // Yield to other goroutines\n\t\t}\n\t}\n}",
    "verification": "Use 'go tool trace' to inspect goroutine scheduling. Ensure no single goroutine occupies a P for more than 10ms without yielding.",
    "date": "2026-03-18",
    "id": 1773827023,
    "type": "error"
});