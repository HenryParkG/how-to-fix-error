window.onPostDataLoaded({
    "title": "Mitigating Go Scheduler Starvation in Tight Loops",
    "slug": "go-scheduler-starvation-gc-stw-tight-loops",
    "language": "Go",
    "code": "Goroutine Starvation (STW Latency)",
    "tags": [
        "Go",
        "Performance",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In the Go runtime, goroutines are multiplexed onto operating system threads (M) via logical processors (P). Before Go 1.14, the scheduler was purely cooperative, yielding execution only at explicit points like function calls or network I/O. Though Go 1.14 introduced asynchronous preemption via OS signals (such as <code>SIGURG</code>), certain tight, highly optimized mathematical loops or low-level, unsafe pointer arithmetic blocks can still fail to yield. This blocks the Garbage Collector (GC) from reaching a safe point (SafePoint) across all active goroutines, leading to catastrophic Stop-the-World (STW) latency spikes and thread starvation.</p>",
    "root_cause": "The Go compiler inserts stack-growth checks at function entry points, which double as cooperative scheduler preemption checkpoints. Tight loops that do not make function calls or are aggressively optimized by the compiler (such as inline or unrolled loops) bypass these checkpoints. If the OS signal-based asynchronous preemption is blocked (e.g., inside system calls, cgo, or when signals are masked), the runtime cannot force the goroutine to yield, causing the GC coordinator to wait indefinitely for a SafePoint.",
    "bad_code": "package main\n\nimport (\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc main() {\n\t// This tight loop can cause scheduler starvation and block GC from starting\n\tgo func() {\n\t\tvar count uint64\n\t\tfor {\n\t\t\tcount++ // Tight loop with no function calls or allocations\n\t\t}\n\t}()\n\n\ttime.Sleep(1 * time.Second)\n\tfmt.Println(\"Completed\") // May hang or delay significantly during active GC cycles\n}",
    "solution_desc": "Manually introduce cooperative scheduling checkpoints inside heavy tight loops using `runtime.Gosched()`, or structure the loop processing in batches to let other scheduler threads proceed. Alternatively, ensure the loop triggers a function call that cannot be inlined, or update the application to use Go's modern runtime preemption paths properly by avoiding long-duration synchronous execution blocks.",
    "good_code": "package main\n\nimport (\n\t\"fmt\"\n\t\"runtime\"\n\t\"time\"\n)\n\nfunc main() {\n\tgo func() {\n\t\tvar count uint64\n\t\tfor {\n\t\t\tcount++\n\t\t\t// Cooperative preemption: yield scheduler control periodically\n\t\t\tif count%10000000 == 0 {\n\t\t\t\truntime.Gosched()\n\t\t\t}\n\t\t}\n\t}()\n\n\ttime.Sleep(1 * time.Second)\n\tfmt.Println(\"Completed gracefully\")\n}",
    "verification": "Compile and run the program with the GODEBUG environment variable: `GODEBUG=gctrace=1 go run main.go`. Monitor the STW sweep and mark phases. Use `go tool trace` to capture runtime profiles and verify that scheduling latency remains low and goroutines yield in under 1ms.",
    "date": "2026-07-01",
    "id": 1782889558,
    "type": "error"
});