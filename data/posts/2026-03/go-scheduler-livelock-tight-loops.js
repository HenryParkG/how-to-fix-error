window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Livelocks in Tight Loops",
    "slug": "go-scheduler-livelock-tight-loops",
    "language": "Go",
    "code": "G-Scheduler-Livelock",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go, the runtime scheduler manages goroutines using a cooperative-ish strategy. Before Go 1.14, a goroutine performing a tight loop without function calls (a 'leaf' function) could occupy a P (Processor) indefinitely, preventing the scheduler from preempting it. This caused 'livelocks' where sysmon would signal for a stop-the-world event (like GC), but the tight loop would never reach a safepoint.</p><p>Even with asynchronous preemption introduced in 1.14+, certain tight loops\u2014especially those involving heavy register pressure or specific architectural edge cases\u2014can still resist preemption signals, leading to high latency for other goroutines and delayed Garbage Collection cycles.</p>",
    "root_cause": "The Go scheduler relies on stack-growth checks at function entries as implicit safepoints. Tight loops without function calls lack these checks, and if asynchronous signals are blocked or delayed, the goroutine never yields control.",
    "bad_code": "func computeSum(data []int) int {\n\tsum := 0\n\t// Tight loop with no function calls\n\tfor i := 0; i < len(data); i++ {\n\t\tsum += data[i]\n\t}\n\treturn sum\n}",
    "solution_desc": "Manually introduce a scheduler yield using runtime.Gosched() or ensure the loop performs a function call that triggers a stack check. For modern Go versions, ensure the environment allows SIGURG signals, which are required for asynchronous preemption.",
    "good_code": "func computeSum(data []int) int {\n\tsum := 0\n\tfor i := 0; i < len(data); i++ {\n\t\tsum += data[i]\n\t\t// Explicitly yield to allow other goroutines and GC to run\n\t\tif i%1000000 == 0 {\n\t\t\truntime.Gosched()\n\t\t}\n\t}\n\treturn sum\n}",
    "verification": "Use 'GODEBUG=schedtrace=1000' to monitor the scheduler. If a goroutine is stuck on one thread (M) for several seconds without shifting, the livelock persists.",
    "date": "2026-03-04",
    "id": 1772586810,
    "type": "error"
});