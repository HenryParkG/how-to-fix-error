window.onPostDataLoaded({
    "title": "Fixing Go Runtime Preemption Stalls in Assembly Loops",
    "slug": "go-runtime-preemption-stalls-assembly",
    "language": "Go",
    "code": "GC Starvation",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions 1.14 and later, the runtime introduced asynchronous preemption via signals. However, tight loops\u2014especially those written in manual Assembly or those that avoid function calls\u2014can still prevent the scheduler from preempting a goroutine. This causes 'Stop the World' (STW) events for Garbage Collection to hang, as the GC waits for all threads to reach a safepoint.</p>",
    "root_cause": "The Go compiler usually inserts preemption checks in function prologues. Manual assembly loops or extremely tight loops without function calls (and thus no 'morestack' calls) may lack these safepoints, causing the thread to never yield to the scheduler during a GC request.",
    "bad_code": "// Tight loop in Go or Assembly that doesn't call functions\nfunc TightLoop(data []int) {\n\tfor i := 0; ; i++ {\n\t\t// Intense calculation without function calls\n\t\tdata[i % len(data)] += i\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() or ensure the loop performs a function call that the compiler can instrument. For assembly, ensure the code is compatible with the Go scheduler's signal-based preemption by not blocking signals or by manually checking the stack guard.",
    "good_code": "func TightLoop(data []int) {\n\tfor i := 0; ; i++ {\n\t\tdata[i % len(data)] += i\n\t\t// Periodically yield to allow preemption/GC\n\t\tif i%1024 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n}",
    "verification": "Run the program with GODEBUG=gctrace=1. If GC cycle times are high and 'STW' phase durations are long, the fix is working if those durations drop significantly.",
    "date": "2026-05-09",
    "id": 1778292097,
    "type": "error"
});