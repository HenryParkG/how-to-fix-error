window.onPostDataLoaded({
    "title": "Go Goroutine Leaks & Scheduler Starvation Fix",
    "slug": "go-goroutine-leaks-scheduler-starvation-fix",
    "language": "Go",
    "code": "GoroutineLeak",
    "tags": [
        "Concurrency",
        "Performance",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Goroutine leaks occur when spawned goroutines become blocked permanently on unbuffered channel operations, orphaned mutexes, or I/O operations lacking timeouts. Because goroutines start with a minimal 2 KB stack and are managed by the Go runtime rather than the OS kernel, millions can be scheduled, obscuring leaks until memory exhaustion triggers an OOM kill.</p><p>Scheduler starvation compounds this issue. Prior to asynchronous preemption in Go 1.14 (and still possible in tight non-inlined loops or runtime boundary conditions), cooperative scheduling depended on function call prologues (<code>morestack</code>) to yield execution via <code>runtime.gosched()</code>. When uncooperative goroutines monopolize an OS thread (<code>M</code>) tied to a logical processor (<code>P</code>), work-stealing fails to migrate blocked local run queues, starving critical background workers such as garbage collection markers and network pollers.</p>",
    "root_cause": "Spawning background goroutines without context-driven termination or channel-drain guarantees, combined with CPU-bound loops lacking preemption points or runtime cooperative yields.",
    "bad_code": "package main\n\nimport (\n\t\"fmt\"\n\t\"net/http\"\n)\n\nfunc queryService(url string) <-chan string {\n\tch := make(chan string) // Unbuffered channel\n\tgo func() {\n\t\tres, err := http.Get(url)\n\t\tif err != nil {\n\t\t\treturn // If abandoned, goroutine leaks on send below if context expires early\n\t\t}\n\t\tdefer res.Body.Close()\n\t\tch <- res.Status // Blocks forever if receiver stops listening\n\t}()\n\treturn ch\n}\n\nfunc HandleRequest() {\n\t// If queryService takes too long, HandleRequest moves on, leaking the goroutine\n\tselect {\n\tcase res := <-queryService(\"https://slow-api.internal/data\"):\n\t\tfmt.Println(res)\n\t}\n}",
    "solution_desc": "Decouple lifecycle management using context.Context propagation and buffered channels with a capacity equal to the expected concurrent emissions. Use runtime/pprof to monitor goroutine counts and enforce non-blocking fallback mechanisms inside select statements.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"fmt\"\n\t\"net/http\"\n\t\"time\"\n)\n\nfunc queryService(ctx context.Context, url string) (string, error) {\n\treq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)\n\tif err != nil {\n\t\treturn \"\", err\n\t}\n\n\tclient := &http.Client{Timeout: 5 * time.Second}\n\tres, err := client.Do(req)\n\tif err != nil {\n\t\treturn \"\", err\n\t}\n\tdefer res.Body.Close()\n\n\treturn res.Status, nil\n}\n\nfunc HandleRequest() {\n\tctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)\n\tdefer cancel()\n\n\tstatus, err := queryService(ctx, \"https://slow-api.internal/data\")\n\tif err != nil {\n\t\tfmt.Printf(\"Request aborted or failed: %v\\n\", err)\n\t\treturn\n\t}\n\tfmt.Println(\"Status:\", status)\n}",
    "verification": "Profile the application using 'go tool pprof http://localhost:6060/debug/pprof/goroutine' under synthetic load. Run unit tests with the 'go.uber.org/goleak' package to assert that no dangling goroutines persist after test suite completion.",
    "date": "2026-09-16",
    "id": 1789546591,
    "type": "error"
});