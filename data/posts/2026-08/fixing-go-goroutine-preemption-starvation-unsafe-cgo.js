window.onPostDataLoaded({
    "title": "Fixing Go Goroutine Preemption Starvation in Unsafe Cgo Calls",
    "slug": "fixing-go-goroutine-preemption-starvation-unsafe-cgo",
    "language": "Go",
    "code": "Cgo Starvation",
    "tags": [
        "Go",
        "Concurrency",
        "Cgo",
        "Performance",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When integrating native C libraries into Go services via Cgo, CPU-intensive C executions can stall the Go runtime scheduler. Although Go 1.14 introduced asynchronous preemption via Unix signals (SIGURG), C code execution resides outside the Go runtime's direct control. If C code runs continuously without calling back into Go or entering system calls that unlock the OS thread, the Go scheduler processor (P) remains bound to the OS thread (M). This prevents other goroutines assigned to that P from running and delays Garbage Collection (GC) Stop-The-World (STW) sweeps, inducing application-wide preemption starvation and extreme latency spikes.</p>",
    "root_cause": "Cgo transitions via runtime.cgocall detach the Goroutine (G) from the Processor (P) by invoking entersyscall, leaving M running C code. However, if C code tightly executes unsafe or inlined compute loops without executing system calls or runtime checkpoints, the scheduler cannot preempt G or reclaim thread M. When active thread counts reach GOMAXPROCS limits, newly spawned goroutines starve while waiting for available Ps.",
    "bad_code": "package main\n\n/*\n#include <stdint.h>\nvoid heavy_c_compute(uint64_t iterations) {\n    uint64_t val = 0;\n    for (uint64_t i = 0; i < iterations; i++) {\n        val += i * 31;\n    }\n}\n*/\nimport \"C\"\nimport (\n\t\"sync\"\n)\n\nfunc ExecuteUnsafeCompute() {\n\tvar wg sync.WaitGroup\n\t// Spawning routines executing long C calls saturates scheduler threads\n\tfor i := 0; i < 100; i++ {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tC.heavy_c_compute(10000000000) // Blocks P and delays GC STW\n\t\t}()\n\t}\n\twg.Wait()\n}",
    "solution_desc": "Architectural mitigation requires chunking C execution and periodically yielding control back to the Go runtime using exported Go callback functions. Alternatively, controlling concurrency via bounded worker pools prevents thread pool exhaustion and ensures available Ps remain free to execute runtime administrative tasks and GC cycles.",
    "good_code": "package main\n\n/*\n#include <stdint.h>\nextern void GoYieldCheck();\n\nstatic inline void heavy_c_compute_chunked(uint64_t iterations, uint64_t chunk_size) {\n    uint64_t val = 0;\n    for (uint64_t i = 0; i < iterations; i++) {\n        val += i * 31;\n        if (i % chunk_size == 0) {\n            GoYieldCheck(); // Yield back to Go runtime for preemption checks\n        }\n    }\n}\n*/\nimport \"C\"\nimport (\n\t\"runtime\"\n\t\"sync\"\n)\n\n//export GoYieldCheck\nfunc GoYieldCheck() {\n\truntime.Gosched() // Preemption point for scheduler and GC\n}\n\nfunc ExecuteSafeCompute() {\n\tvar wg sync.WaitGroup\n\tsem := make(chan struct{}, runtime.GOMAXPROCS(0))\n\n\tfor i := 0; i < 100; i++ {\n\t\twg.Add(1)\n\t\tsem <- struct{}{}\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tdefer func() { <-sem }()\n\t\t\tC.heavy_c_compute_chunked(10000000000, 10000000)\n\t\t}()\n\t}\n\twg.Wait()\n}",
    "verification": "Verify using GODEBUG=schedtrace=1000,scheddetail=1 or 'go tool trace'. Confirm that no P remains trapped in 'syscall' or 'running' state indefinitely during GC requests, and that GC pause times (STW) remain under target SLAs (<1ms).",
    "date": "2026-08-11",
    "id": 1786441910,
    "type": "error"
});