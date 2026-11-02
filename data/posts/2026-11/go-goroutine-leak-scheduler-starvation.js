window.onPostDataLoaded({
    "title": "Fixing Go Goroutine Leaks & Scheduler Starvation",
    "slug": "go-goroutine-leak-scheduler-starvation",
    "language": "Go",
    "code": "GoroutineLeak",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Go applications, improper synchronization primitives often lead to silent goroutine accumulation. When goroutines block indefinitely on unbuffered channel writes or abandoned receive operations, the Go runtime garbage collector cannot reclaim their stack memory (initially 2KB to 8KB, growing dynamically), leading to memory bloat and eventual OOM kills.</p><p>Concurrently, tight compute-intensive loops without function call prologues or preemption checkpoints can monopolize OS threads (M) on logical processors (P). In scenarios with non-cooperative loops prior to Go's asynchronous preemption or loops with memory-pinned operations, the Go scheduler starves other runnable goroutines, dramatically spiking P99 latency.</p>",
    "root_cause": "Goroutines blocking permanently on unbuffered channels when consumer contexts exit, coupled with tight compute loops preventing runtime cooperative scheduler handoffs.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc processWork(ctx context.Context, item int) <-chan int {\n\tch := make(chan int) // Unbuffered: sender blocks if ctx cancels\n\tgo func() {\n\t\t// Tight loop without preemption check\n\t\tval := item\n\t\tfor i := 0; i < 1e8; i++ {\n\t\t\tval += (i ^ item) % 7\n\t\t}\n\t\tch <- val // Leaks if receiver abandoned channel due to ctx timeout\n\t}()\n\treturn ch\n}\n\nfunc main() {\n\tctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)\n\tdefer cancel()\n\n\tresCh := processWork(ctx, 42)\n\tselect {\n\tcase res := <-resCh:\n\t\tfmt.Println(\"Result:\", res)\n\tcase <-ctx.Done():\n\t\tfmt.Println(\"Timeout! Goroutine now leaked.\")\n\t}\n}",
    "solution_desc": "Tie goroutine lifecycles explicitly to context cancellation or use buffered channels sized to the expected delivery count. Inject runtime preemption yields (runtime.Gosched) in heavy compute routines and handle context cancellation across all channel send/receive branches.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"fmt\"\n\t\"runtime\"\n\t\"time\"\n)\n\nfunc processWork(ctx context.Context, item int) <-chan int {\n\t// Sized buffer prevents sender leak even if consumer departs\n\tch := make(chan int, 1)\n\tgo func() {\n\t\tval := item\n\t\tfor i := 0; i < 1e8; i++ {\n\t\t\t// Cooperative scheduler yield for CPU-intensive paths\n\t\t\tif i%1e6 == 0 {\n\t\t\t\truntime.Gosched()\n\t\t\t}\n\t\t\tval += (i ^ item) % 7\n\t\t}\n\t\tselect {\n\t\tcase ch <- val:\n\t\tcase <-ctx.Done():\n\t\t\t// Drain or abort cleanly\n\t\t}\n\t}()\n\treturn ch\n}\n\nfunc main() {\n\tctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)\n\tdefer cancel()\n\n\tresCh := processWork(ctx, 42)\n\tselect {\n\tcase res := <-resCh:\n\t\tfmt.Println(\"Result:\", res)\n\tcase <-ctx.Done():\n\t\tfmt.Println(\"Safely timed out without leaking goroutine.\")\n\t}\n}",
    "verification": "Profile active goroutines using net/http/pprof. Access /debug/pprof/goroutine?debug=2 to inspect stack traces. Run tests with 'go test -race' and verify goroutine counts stay flat under load via runtime.NumGoroutine().",
    "date": "2026-11-02",
    "id": 1793629218,
    "type": "error"
});