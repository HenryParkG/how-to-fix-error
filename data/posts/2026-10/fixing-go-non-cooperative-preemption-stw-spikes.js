window.onPostDataLoaded({
    "title": "Fixing Go Non-Cooperative Preemption & STW Spikes",
    "slug": "fixing-go-non-cooperative-preemption-stw-spikes",
    "language": "Go",
    "code": "STWLatencySpike",
    "tags": [
        "Go",
        "Performance",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go 1.14+, the runtime introduced asynchronous preemption using OS signals (SIGURG on Unix) to preempt tight CPU loops that lack function calls. However, non-cooperative preemption can still fail when execution enters unsafe runtime states, assembly routines, cgo boundaries, or loops where the compiler omits async preemption checks due to register allocation or pointer spill barriers.</p><p>When a goroutine cannot be preempted, the Go Garbage Collector (GC) becomes blocked waiting to transition into Mark Termination or Sweep phases. This triggers severe Stop-The-World (STW) latency spikes because all other threads halt while waiting for the single non-cooperative goroutine to hit a safepoint.</p>",
    "root_cause": "A tight loop operating without safe allocation boundaries or standard function calls forces the runtime sysmon thread to signal SIGURG continuously without the target thread yielding, delaying GC phase transitions and starving other goroutines on the P (processor).",
    "bad_code": "package main\n\nfunc computeChecksums(data []byte) uint64 {\n\tvar acc uint64\n\t// Tight loop without function calls or safe GC preemption points\n\tfor i := 0; i < len(data); i++ {\n\t\tacc = (acc << 5) - acc + uint64(data[i])\n\t}\n\treturn acc\n}",
    "solution_desc": "Manually introduce cooperative scheduling checkpoints using runtime.Gosched(), restructure batch iteration to yield execution periodically, or modularize loop bodies into non-inlined function boundaries that emit standard compiler stack checks (morestack).",
    "good_code": "package main\n\nimport \"runtime\"\n\nfunc computeChecksums(data []byte) uint64 {\n\tvar acc uint64\n\tfor i := 0; i < len(data); i++ {\n\t\tacc = (acc << 5) - acc + uint64(data[i])\n\t\t// Yield processor cooperatively on large iterations\n\t\tif i&0x3FFFF == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n\treturn acc\n}",
    "verification": "Compile with GODEBUG=gctrace=1,schedtrace=1000 and run go tool trace trace.out to inspect the GC STW duration. Verify that STW pause times drop from multi-millisecond peaks down to sub-millisecond ranges without 'P' starvation.",
    "date": "2026-10-15",
    "id": 1792051030,
    "type": "error"
});