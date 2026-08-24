window.onPostDataLoaded({
    "title": "Fixing Go Goroutine Leaks & Starvation",
    "slug": "fixing-go-goroutine-leaks-scheduler-starvation",
    "language": "Go",
    "code": "GoroutineLeak",
    "tags": [
        "Go",
        "Concurrency",
        "Profiling",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Goroutine leaks occur when spawned goroutines are blocked indefinitely on unbuffered channels, synchronization primitives, or uncancelled context trees. Because the Go runtime garbage collector does not collect running or blocked goroutines, leaked goroutines retain their stack allocations and any referenced heap objects, leading to unbounded memory growth. Furthermore, intensive computational loops without preemption points (cooperative yields or runtime safepoints) can lead to M-P-G starvation under high load scenarios.</p><p>Using <code>net/http/pprof</code>, developers often observe a monotonically increasing goroutine count via <code>/debug/pprof/goroutine?debug=1</code>. The leak frequently stems from worker pools failing to respect cancellation signals when sending downstream results into unbuffered channels whose receivers have already timed out and exited.</p>",
    "root_cause": "Spawning a goroutine that performs a blocking channel send without a default branch or context cancellation check, causing the sender to wait indefinitely when the receiving function exits early due to a timeout.",
    "bad_code": "func FetchDataWithTimeout(ctx context.Context, url string) ([]byte, error) {\n\tch := make(chan []byte)\n\terrCh := make(chan error)\n\n\tgo func() {\n\t\tres, err := http.Get(url)\n\t\tif err != nil {\n\t\t\terrCh <- err // Leaks if context cancels before send\n\t\t\treturn\n\t\t}\n\t\tdefer res.Body.Close()\n\t\tbody, _ := io.ReadAll(res.Body)\n\t\tch <- body // Leaks if receiver times out\n\t}()\n\n\tselect {\n\tcase <-ctx.Done():\n\t\treturn nil, ctx.Err()\n\tcase res := <-ch:\n\t\treturn res, nil\n\tcase err := <-errCh:\n\t\treturn nil, err\n\t}\n}",
    "solution_desc": "Use buffered channels with sufficient capacity for concurrent producers or select on <code>ctx.Done()</code> during all channel send operations. Pass the request context down to HTTP clients to ensure underlying network sockets and I/O loops terminate immediately upon cancellation.",
    "good_code": "func FetchDataWithTimeout(ctx context.Context, url string) ([]byte, error) {\n\tch := make(chan []byte, 1)\n\terrCh := make(chan error, 1)\n\n\tgo func() {\n\t\treq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)\n\t\tif err != nil {\n\t\t\terrCh <- err\n\t\t\treturn\n\t\t}\n\t\tres, err := http.DefaultClient.Do(req)\n\t\tif err != nil {\n\t\t\terrCh <- err\n\t\t\treturn\n\t\t}\n\t\tdefer res.Body.Close()\n\t\tbody, err := io.ReadAll(res.Body)\n\t\tif err != nil {\n\t\t\terrCh <- err\n\t\t\treturn\n\t\t}\n\t\tch <- body\n\t}()\n\n\tselect {\n\tcase <-ctx.Done():\n\t\treturn nil, ctx.Err()\n\tcase res := <-ch:\n\t\treturn res, nil\n\tcase err := <-errCh:\n\t\treturn nil, err\n\t}\n}",
    "verification": "Inspect runtime goroutine counts using `runtime.NumGoroutine()` or execute `go test -race` alongside `uber-go/goleak` in your unit test suites to automatically flag leftover goroutines.",
    "date": "2026-08-24",
    "id": 1787532159,
    "type": "error"
});