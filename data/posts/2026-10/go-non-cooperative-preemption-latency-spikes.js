window.onPostDataLoaded({
    "title": "Fixing Go Safe-Point Traps in Tight CPU Loops",
    "slug": "go-non-cooperative-preemption-latency-spikes",
    "language": "Go",
    "code": "STWLatencySpike",
    "tags": [
        "Go",
        "Performance",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Go 1.14+, the runtime introduced asynchronous non-cooperative preemption via OS-level signals (<code>SIGURG</code>). However, long GC Stop-The-World (STW) pauses still routinely occur in high-throughput workloads executing tight compute loops.</p><p>When a Goroutine runs a tight numeric, serialization, or cryptographic loop without function calls, the compiler avoids emitting standard <code>runtime.morestack</code> safe-point checks. While asynchronous preemption injects a signal to hijack the instruction pointer, safe-point checks remain invalid if registers contain transient pointer-like values or if the CPU is in an atomic or AVX/vectorized instruction state where stack maps cannot be safely computed. As a result, the GC coordinator stalls during mark-termination waiting for all Ps to report to a safe-point, driving P99.9 latencies from microseconds to hundreds of milliseconds.</p>",
    "root_cause": "The Go garbage collector requires all running threads to reach a GC safe-point where stack frames can be scanned. Tight loops without cooperative yield points or valid register-to-stack pointer maps reject asynchronous SIGURG interruption, forcing the runtime to wait until the loop terminates before completing mark termination.",
    "bad_code": "package main\n\nfunc ProcessPixelBuffer(buf []uint32) {\n\t// Tight loop prevents safe-point evaluation;\n\t// register allocation keeps pointer state opaque to GC async preemptor.\n\tfor i := 0; i < len(buf); i++ {\n\t\tv := buf[i]\n\t\tv = (v ^ 0x5A5A5A5A) + (v >> 3)\n\t\tv ^= (v << 7)\n\t\tbuf[i] = v * 0x27d4eb2d\n\t}\n}",
    "solution_desc": "Break monolithic tight loops by inserting cooperative safe points via runtime.Gosched(), or partition workloads into bounded batches. For performance-sensitive tight loops where runtime.Gosched() introduces unacceptable overhead, use iteration-modulo yielding or chunking to allow the runtime scheduler to preempt safely at predictable intervals without GC stalls.",
    "good_code": "package main\n\nimport \"runtime\"\n\nfunc ProcessPixelBuffer(buf []uint32) {\n\tconst batchSize = 65536\n\tn := len(buf)\n\t\n\tfor start := 0; start < n; start += batchSize {\n\t\tend := start + batchSize\n\t\tif end > n {\n\t\tend = n\n\t\t}\n\t\t\n\t\t// Execute batch in tight inner loop\n\t\tfor i := start; i < end; i++ {\n\t\t\tv := buf[i]\n\t\t\tv = (v ^ 0x5A5A5A5A) + (v >> 3)\n\t\t\tv ^= (v << 7)\n\t\t\tbuf[i] = v * 0x27d4eb2d\n\t\t}\n\t\t\n\t\t// Cooperative yield ensures predictable GC safe-point convergence\n\t\truntime.Gosched()\n\t}\n}",
    "verification": "Run the application with `GODEBUG=gctrace=1,asyncpreemptoff=0` and capture execution traces using `go tool trace trace.out`. Verify that `STW (mark termination)` metrics drop from >50ms to <1ms and that `GC (dedicated)` phases no longer block scheduling on neighboring threads.",
    "date": "2026-10-17",
    "id": 1792221610,
    "type": "error"
});