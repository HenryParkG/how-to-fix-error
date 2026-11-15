window.onPostDataLoaded({
    "title": "Go Goroutine Leaks & Scheduler Starvation",
    "slug": "go-goroutine-leak-scheduler-starvation-fix",
    "language": "Go",
    "code": "ERR_GOROUTINE_LEAK",
    "tags": [
        "Go",
        "Concurrency",
        "Profiling",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Go services, unbuffered channels and missing cancellation propagation frequently lead to goroutine accumulation. When a producer cannot deliver a payload to a receiver that has already returned or timed out, the spawning goroutine remains blocked in memory indefinitely.</p><p>As thousands of leaked goroutines accumulate, the Go runtime scheduler incurs severe overhead walking heap allocations and evaluating runnable threads. Combined with tight, non-preemptible computation loops or lock contention on memory structures, this induces runtime M:N scheduler starvation where worker threads spend excessive time in garbage collection sweeps and context switches rather than executing incoming requests.</p>",
    "root_cause": "Goroutines blocking indefinitely on unbuffered channel sends when caller contexts expire, compounded by CPU-intensive loops lacking preemption points or runtime yield calls.",
    "bad_code": "func processRequest(ctx context.Context, payload []byte) ([]byte, error) {\n\tch := make(chan []byte)\n\n\tgo func() {\n\t\t// Leaks if ctx is cancelled: no receiver will ever read from ch\n\t\tresult := heavyComputation(payload)\n\t\tch <- result\n\t}()\n\n\tselect {\n\tcase <-ctx.Done():\n\t\treturn nil, ctx.Err()\n\tcase res := <-ch:\n\t\treturn res, nil\n\t}\n}",
    "solution_desc": "Use buffered channels with capacity matching concurrent workers, select on context cancellation inside the spawned goroutine to abort work early, and use a bounded worker pool instead of uncontrolled goroutine allocation.",
    "good_code": "func processRequest(ctx context.Context, payload []byte) ([]byte, error) {\n\t// Use a 1-slot buffer so send succeeds even if caller times out\n\tch := make(chan []byte, 1)\n\n\tgo func() {\n\t\tselect {\n\t\tcase <-ctx.Done():\n\t\t\treturn\n\t\tdefault:\n\t\t\tresult := heavyComputation(payload)\n\t\t\tselect {\n\t\t\tcase <-ctx.Done():\n\t\t\t\treturn\n\t\t\tcase ch <- result:\n\t\t\t}\n\t\t}\n\t}()\n\n\tselect {\n\tcase <-ctx.Done():\n\t\treturn nil, ctx.Err()\n\tcase res := <-ch:\n\t\treturn res, nil\n\t}\n}",
    "verification": "Profile the service using pprof via `go tool pprof http://localhost:6060/debug/pprof/goroutine`. Verify goroutine count plateaus under sustained load tests (e.g., using `k6` or `hey`) rather than growing linearly over time.",
    "date": "2026-11-15",
    "id": 1794749046,
    "type": "error"
});