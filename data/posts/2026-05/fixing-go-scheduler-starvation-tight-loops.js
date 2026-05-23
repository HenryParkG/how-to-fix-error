window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Tight Loops",
    "slug": "fixing-go-scheduler-starvation-tight-loops",
    "language": "Go",
    "code": "Scheduler Starvation",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go applications, heavy CPU-bound operations executed within tight loops can occasionally starve the Go runtime scheduler. Even with the introduction of asynchronous preemption in Go 1.14 (which uses OS signals like SIGURG to preempt goroutines), certain highly optimized, non-cooperative tight loops\u2014especially those without function calls or those performing raw numerical operations in a single block\u2014can bypass preemption. When a goroutine monopolizes an operating system thread (M) without yielding, other goroutines queued on the local run queue (P) cannot run, causing extreme tail latency spikes, delayed garbage collection sweeps, and unresponsive HTTP health check endpoints.</p>",
    "root_cause": "The Go scheduler relies on cooperative checkpoints (placed at function prologues) and asynchronous preemption signals. If a loop is fully self-contained, register-allocated, contains no function calls, and is compiled in a way that masks or delays signal delivery, the scheduler cannot preempt the executing thread, resulting in thread starvation.",
    "bad_code": "package main\n\nimport (\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc main() {\n\t// This tight loop can cause scheduler starvation on single-core setups\n\t// or delay GC sweeps across multi-threaded runtimes.\n\tgo func() {\n\t\tvar target uint64 = 1e15\n\t\tvar count uint64 = 0\n\t\tfor i := uint64(0); i < target; i++ {\n\t\t\tcount += i ^ 0xDEADBEEF // Pure CPU-bound math with no function calls\n\t\t}\n\t\tfmt.Println(\"Completed:\", count)\n\t}()\n\n\ttime.Sleep(10 * time.Millisecond)\n\tfmt.Println(\"This print statement might be severely delayed!\")\n}",
    "solution_desc": "To fix this, we can introduce explicit cooperative yields using 'runtime.Gosched()' inside the tight loop, or partition the calculation into smaller chunks that process iteratively using worker pools to naturally allow context switching.",
    "good_code": "package main\n\nimport (\n\t\"fmt\"\n\t\"runtime\"\n\t\"time\"\n)\n\nfunc main() {\n\tgo func() {\n\t\tvar target uint64 = 1e15\n\t\tvar count uint64 = 0\n\t\tfor i := uint64(0); i < target; i++ {\n\t\t\tcount += i ^ 0xDEADBEEF\n\n\t\t\t// Cooperatively yield the processor every 1,000,000 iterations\n\t\t\tif i%1000000 == 0 {\n\t\t\t\truntime.Gosched()\n\t\t\t}\n\t\t}\n\t\tfmt.Println(\"Completed:\", count)\n\t}()\n\n\ttime.Sleep(10 * time.Millisecond)\n\tfmt.Println(\"This print statement executes immediately!\")\n}",
    "verification": "Compile and run the program with the GODEBUG environment variable set to trace scheduler events: 'GODEBUG=schedtrace=1000 ./app'. Observe if goroutines are swapped correctly and trace output prints continuously without hanging blocks.",
    "date": "2026-05-23",
    "id": 1779524473,
    "type": "error"
});