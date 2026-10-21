window.onPostDataLoaded({
    "title": "Fix Go STW Preemption Starvation in CPU Loops",
    "slug": "fix-go-runtime-stw-preemption-starvation",
    "language": "Go",
    "code": "STWStarvation",
    "tags": [
        "Go",
        "Concurrency",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go runtimes, tight compute loops that lack function calls or allocation points can delay Stop-The-World (STW) pauses initiated by the garbage collector or scheduler. Even though Go 1.14 introduced asynchronous preemption via OS signals (<code>SIGURG</code>), certain tight register-bound loops or environments with masked signals can still fail to preempt promptly.</p><p>When a garbage collection cycle triggers STW synchronization, the runtime waits for all running OS threads (<code>M</code>s) executing goroutines (<code>G</code>s) to reach a safepoint. If a thread is stuck executing non-preemptible or uncooperative numeric iterations, p99 latencies skyrocket, and other goroutines waiting on that OS thread starve indefinitely.</p>",
    "root_cause": "The Go compiler omits safepoint checks in tight unrolled loops without function calls. If asynchronous signal preemption is delayed, blocked, or unavailable, the goroutine never yields execution to allow the GC to complete STW phase synchronization.",
    "bad_code": "package main\n\nfunc computeHeavySum(data []float64) float64 {\n\tvar sum float64\n\t// Tight loop without function calls or allocation points\n\t// Can starve Go runtime STW phase synchronization\n\tfor i := 0; i < len(data); i++ {\n\t\tsum += data[i] * 1.0000001\n\t}\n\treturn sum\n}",
    "solution_desc": "Introduce periodic cooperative scheduling checks using `runtime.Gosched()` at power-of-two iteration boundaries, or restructure the loop to allow the compiler to emit proper safepoint preemption checks without sacrificing CPU cache locality.",
    "good_code": "package main\n\nimport \"runtime\"\n\nfunc computeHeavySum(data []float64) float64 {\n\tvar sum float64\n\tconst yieldMask = 0xFFFF // Yield every 65,536 iterations\n\n\tfor i := 0; i < len(data); i++ {\n\t\tsum += data[i] * 1.0000001\n\t\tif i&yieldMask == 0 {\n\t\t\truntime.Gosched() // Explicit cooperative yield to scheduler\n\t\t}\n\t}\n\treturn sum\n}",
    "verification": "Run the application with `GODEBUG=gctrace=1,schedtrace=1000` while under high compute load. Check execution traces with `go tool trace` to verify that GC STW pause durations remain under 1 millisecond and no goroutines are marked as starved on a single thread.",
    "date": "2026-10-21",
    "id": 1792550054,
    "type": "error"
});