window.onPostDataLoaded({
    "title": "Mitigating Go Scheduler Livelocks in Tight Loops",
    "slug": "mitigating-go-scheduler-livelocks-tight-loops",
    "language": "Go",
    "code": "Livelock",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In the Go runtime, the scheduler uses a cooperative approach with periodic preemption. However, in versions prior to 1.14, or in specific high-compute scenarios where loops lack function calls, a goroutine can 'monopolize' a processor (P). This prevents the Garbage Collector from reaching a STW (Stop The World) checkpoint and blocks other goroutines from being scheduled on that OS thread, effectively causing a livelock or severe latency spikes.</p>",
    "root_cause": "Tight loops without function calls (non-inlined) prevent the compiler from inserting stack-growth checks, which the scheduler uses as preemption points.",
    "bad_code": "func computeSum(data []int) int {\n\tsum := 0\n\tfor i := 0; i < len(data); i++ {\n\t\t// Tight loop: no function calls, no preemption\n\t\tsum += data[i]\n\t}\n\treturn sum\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() within long-running loops or upgrade to Go 1.14+ which supports asynchronous preemption via OS signals. For extremely performance-sensitive tight loops, breaking the work into chunks is preferred.",
    "good_code": "import \"runtime\"\n\nfunc computeSum(data []int) int {\n\tsum := 0\n\tfor i := 0; i < len(data); i++ {\n\t\tsum += data[i]\n\t\tif i%1000000 == 0 {\n\t\t\truntime.Gosched() // Explicitly yield processor\n\t\t}\n\t}\n\treturn sum\n}",
    "verification": "Use 'GODEBUG=schedtrace=1000' to monitor scheduler statistics and check if a single G is stuck on a P for extended periods.",
    "date": "2026-03-05",
    "id": 1772703272,
    "type": "error"
});