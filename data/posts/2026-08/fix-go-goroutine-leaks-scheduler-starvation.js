window.onPostDataLoaded({
    "title": "Fixing Go Goroutine Leaks and Scheduler Starvation",
    "slug": "fix-go-goroutine-leaks-scheduler-starvation",
    "language": "Go",
    "code": "GoroutineLeak",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>Goroutine leaks occur when newly spawned goroutines remain blocked indefinitely on unbuffered channel operations, locks, or I/O calls without context cancellation. Over time, these idle goroutines consume memory and runtime tracking resources, eventually causing out-of-memory (OOM) crashes. Additionally, pre-Go 1.14 un-preemptible tight loops or lock contention can starve the Go M:N scheduler, preventing other worker goroutines from executing on available logical processors (P).</p>",
    "root_cause": "Blocking writes to unbuffered channels without an active listener, missing context cancellation propagations, and blocking loops lacking runtime preemption safepoints.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc queryData(ctx context.Context) string {\n\tch := make(chan string) // Unbuffered channel\n\tgo func() {\n\t\ttime.Sleep(2 * time.Second)\n\t\t// If timeout occurs, nobody reads from ch; this goroutine leaks forever\n\t\tch <- \"query result\"\n\t}()\n\n\tselect {\n\tcase res := <-ch:\n\t\treturn res\n\tcase <-ctx.Done():\n\t\treturn \"timeout\"\n\t}\n}",
    "solution_desc": "Use buffered channels when firing asynchronous worker results, or ensure cancellation channels are respected inside the worker goroutine via select blocks. Always propagate context.Context across concurrency boundaries.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"time\"\n)\n\nfunc queryData(ctx context.Context) string {\n\t// Use a buffered channel of size 1 so the goroutine never blocks on send\n\tch := make(chan string, 1)\n\n\tgo func() {\n\t\tselect {\n\t\tcase <-ctx.Done():\n\t\t\treturn\n\t\tcase <-time.After(2 * time.Second):\n\t\t\tch <- \"query result\"\n\t\t}\n\t}()\n\n\tselect {\n\tcase res := <-ch:\n\t\treturn res\n\tcase <-ctx.Done():\n\t\treturn \"timeout\"\n\t}\n}",
    "verification": "Execute tests with 'go test -race -v' and profile active goroutines using net/http/pprof at '/debug/pprof/goroutine?debug=2' to verify goroutine counts stabilize under load.",
    "date": "2026-08-30",
    "id": 1788057178,
    "type": "error"
});