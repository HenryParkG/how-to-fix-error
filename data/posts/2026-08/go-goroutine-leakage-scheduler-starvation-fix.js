window.onPostDataLoaded({
    "title": "Fix Go Goroutine Leaks & Scheduler Starvation",
    "slug": "go-goroutine-leakage-scheduler-starvation-fix",
    "language": "Go",
    "code": "GoroutineLeak",
    "tags": [
        "Go",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Goroutine leakage and Go runtime scheduler starvation represent critical concurrency anti-patterns in high-throughput microservices. In Go's M:N scheduler model (GMP), goroutines (G) are multiplexed onto operating system threads (M) managed via logical processors (P). When a goroutine initiates an unbuffered channel send or wait on an external lock without context cancellation boundaries, it remains allocated in memory indefinitely.</p><p>Furthermore, CPU-bound tight loops without function calls or explicit preemption checks prior to non-cooperative preemption (or loops continuously thrashing syscall allocations) can starve the local run queue on assigned P instances, drastically increasing tail latencies across co-located HTTP/gRPC handlers.</p>",
    "root_cause": "Orphaned goroutines blocked on unbuffered channels where the receiver has already terminated or timed out, preventing garbage collection and accumulating uncollected stack memory.",
    "bad_code": "func handleUserRequest(ctx context.Context, userID string) (*Data, error) {\n    ch := make(chan *Data)\n    \n    // Bug: If ctx times out, no receiver exists for ch.\n    // The child goroutine hangs indefinitely on 'ch <- result'.\n    go func() {\n        result := fetchFromUpstream(userID)\n        ch <- result\n    }()\n    \n    select {\n    case <-ctx.Done():\n        return nil, ctx.Err()\n    case res := <-ch:\n        return res, nil\n    }\n}",
    "solution_desc": "Architect goroutines with bounded buffered channels or explicit multiplexed select blocks that listen to `ctx.Done()`. This guarantees the producer goroutine terminates cleanly even if the consumer context expires prematurely.",
    "good_code": "func handleUserRequest(ctx context.Context, userID string) (*Data, error) {\n    // Fix: Use buffered channel or monitor ctx.Done() inside the producer\n    ch := make(chan *Data, 1)\n    \n    go func() {\n        result := fetchFromUpstream(userID)\n        select {\n        case <-ctx.Done():\n            return // Abort execution if caller has abandoned\n        case ch <- result:\n        }\n    }()\n    \n    select {\n    case <-ctx.Done():\n        return nil, ctx.Err()\n    case res := <-ch:\n        return res, nil\n    }\n}",
    "verification": "Profile active goroutines using `net/http/pprof` via `/debug/pprof/goroutine?debug=2` and integrate uber-go/goleak into unit/integration test suites to assert zero leftover goroutines post-execution.",
    "date": "2026-08-22",
    "id": 1787369685,
    "type": "error"
});