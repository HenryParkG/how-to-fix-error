window.onPostDataLoaded({
    "title": "Fix Goroutine Starvation in Compute-Intensive Loops",
    "slug": "fixing-goroutine-starvation-scheduling-gaps",
    "language": "Go",
    "code": "StarvationError",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler was strictly cooperative, meaning a goroutine would only yield if it performed a function call, I/O, or channel operation. In modern Go, while asynchronous preemption exists, tight compute-intensive loops that lack function calls (non-inlined) can still lead to 'scheduling starvation.' This occurs when a single goroutine monopolizes a processor (P), preventing the garbage collector or other goroutines from running, leading to increased latency or even application deadlocks in high-concurrency scenarios.</p>",
    "root_cause": "The Go scheduler relies on stack growth checks or signal-based preemption; however, extremely tight loops without function calls can bypass these checks, keeping the thread 'busy' and blocking the P.",
    "bad_code": "func computeSum(data []int) int {\n\tsum := 0\n\t// Tight loop without function calls can block the scheduler\n\tfor i := 0; i < len(data); i++ {\n\t\tsum += data[i] * 2\n\t}\n\treturn sum\n}",
    "solution_desc": "Manually introduce a preemption point using runtime.Gosched() or ensure the loop is broken into chunks that allow the scheduler to context switch. For long-running loops, periodic yields ensure fairness.",
    "good_code": "import \"runtime\"\n\nfunc computeSumFixed(data []int) int {\n\tsum := 0\n\tfor i := 0; i < len(data); i++ {\n\t\tsum += data[i] * 2\n\t\t// Yield processor every 1024 iterations to prevent starvation\n\t\tif i%1024 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n\treturn sum\n}",
    "verification": "Use 'GODEBUG=schedtrace=1000' to monitor scheduler behavior and verify that goroutines are being redistributed across Ps.",
    "date": "2026-03-25",
    "id": 1774431850,
    "type": "error"
});