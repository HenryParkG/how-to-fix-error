window.onPostDataLoaded({
    "title": "Mitigating Go Scheduler Livelocks in Preemption Loops",
    "slug": "go-scheduler-livelock-preemption",
    "language": "Go",
    "code": "Livelock",
    "tags": [
        "Go",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go's runtime, the scheduler historically relied on cooperative preemption at function call sites. When a goroutine enters a \"hot loop\"\u2014a tight loop performing intense computation without calling any functions\u2014the scheduler may be unable to preempt it. This leads to 'scheduler livelock', where one goroutine monopolizes a processor (P), preventing garbage collection (GC) cycles from completing and stalling other goroutines, even if GOMAXPROCS is high.</p>",
    "root_cause": "The Go scheduler cannot interrupt a goroutine that does not contain 'safe points' (typically function calls) unless asynchronous preemption (introduced in Go 1.14 via signals) is successfully triggered and handled.",
    "bad_code": "func compute() {\n\tfor {\n\t\t// Tight loop with no function calls\n\t\t// Go < 1.14 will never preempt this\n\t\ti++\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() in tight loops, or ensure the code is running on Go 1.14+ where the runtime uses SIGURG signals to preempt long-running loops asynchronously.",
    "good_code": "func compute() {\n\tfor i := 0; ; i++ {\n\t\t// Manually yield if on old versions or ultra-tight loops\n\t\tif i%1000 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n}",
    "verification": "Run the code with GOMAXPROCS=1 and attempt to execute a second goroutine. If the second goroutine prints output, preemption is working.",
    "date": "2026-05-12",
    "id": 1778574952,
    "type": "error"
});