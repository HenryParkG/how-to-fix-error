window.onPostDataLoaded({
    "title": "Fix Go GC Safe-Point Stalls and Goroutine Starvation",
    "slug": "go-gc-safepoint-goroutine-starvation-tight-loops",
    "language": "Go",
    "code": "GCStarvation",
    "tags": [
        "Go",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In the Go runtime, the garbage collector relies on cooperative preemption and safe-points to coordinate Stop-The-World (STW) phases. Prior to Go 1.14, loops without function calls could not be preempted at all. Even with Go's asynchronous signal-based preemption (via <code>SIGURG</code>), tight numerical loops or unrolled iterations that spend prolonged periods in registers without pointers or system calls can delay GC safe-point rendezvous.</p><p>When a goroutine running on an OS thread (M) fails to yield promptly, the runtime's <code>sysmon</code> thread repeatedly attempts preemption signals. Under high computational intensity, signal delivery delays or register-bound execution loops cause GC phases (like <code>markTermination</code> or sweep prep) to stall all other threads, resulting in latency spikes exceeding hundreds of milliseconds and starving other goroutines queued on the local run queue (P).</p>",
    "root_cause": "Tight computational loops without safe-point insertion or heap allocations delay runtime signal handling and cooperative preemption, preventing the garbage collector from reaching STW synchronization.",
    "bad_code": "package main\n\nimport (\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc computeHeavy(done *bool) {\n\tvar counter uint64\n\t// Tight loop: no allocations, no runtime function calls\n\tfor !*done {\n\t\tcounter++\n\t}\n\tfmt.Println(\"Completed:\", counter)\n}\n\nfunc main() {\n\tdone := false\n\tgo computeHeavy(&done)\n\n\ttime.Sleep(10 * time.Millisecond)\n\tdone = true // May take significant time to register due to preemption stalls\n\ttime.Sleep(100 * time.Millisecond)\n}",
    "solution_desc": "Insert explicit preemption checkpoints using `runtime.Gosched()` inside compute-heavy loops, or partition computations into bounded batches. This guarantees that `sysmon` or GC mark phases can immediately acquire the P and transition goroutine states without latency degradation.",
    "good_code": "package main\n\nimport (\n\t\"fmt\"\n\t\"runtime\"\n\t\"sync/atomic\"\n\t\"time\"\n)\n\nfunc computeHeavy(stopFlag *atomic.Bool) {\n\tvar counter uint64\n\tfor !stopFlag.Load() {\n\t\tcounter++\n\t\t// Cooperative yield every N iterations ensures safe-point compliance\n\t\tif counter&0xFFFFF == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n\tfmt.Println(\"Completed safely:\", counter)\n}\n\nfunc main() {\n\tvar stopFlag atomic.Bool\n\tgo computeHeavy(&stopFlag)\n\n\ttime.Sleep(10 * time.Millisecond)\n\tstopFlag.Store(true)\n\ttime.Sleep(50 * time.Millisecond)\n}",
    "verification": "Profile using `GODEBUG=gctrace=1,schedtrace=500` and `go tool trace trace.out`. Verify that STW GC pause times remain below 1ms and thread descheduling latency shows zero outlier stalls.",
    "date": "2026-10-09",
    "id": 1791548546,
    "type": "error"
});