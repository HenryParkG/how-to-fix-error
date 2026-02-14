window.onPostDataLoaded({
    "title": "Go Runtime: Fixing Preemption Deadlocks",
    "slug": "go-runtime-preemption-deadlocks",
    "language": "Go",
    "code": "Deadlock",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler was strictly cooperative, meaning a goroutine had to reach a function call (a safe-point) to be preempted. Even with non-cooperative preemption introduced in 1.14 via signals (SIGURG), certain tight loops—especially those performing heavy mathematical operations or memory-intensive tasks without function calls—can still hang the scheduler. This prevents the Garbage Collector (GC) from starting, leading to a Stop-The-World (STW) deadlock where the entire application freezes because one goroutine refuses to yield the processor.</p>",
    "root_cause": "The Go scheduler cannot find a safe-point to inject a preemption signal in a loop that lacks function calls or stack-growth checks.",
    "bad_code": "func busyLoop() {\n\tfor i := 0; i < 1e15; i++ {\n\t\t// Tight loop with no function calls\n\t\t// Go scheduler may fail to preempt this effectively\n\t\t_ = i * i\n\t}\n}",
    "solution_desc": "Manually invoke the scheduler using runtime.Gosched() inside the loop or refactor the logic to include function calls that trigger stack-bound checks. Ensure you are using Go 1.14+ to take advantage of asynchronous preemption, but remain cautious of system call boundaries.",
    "good_code": "func busyLoopFixed() {\n\tfor i := 0; i < 1e15; i++ {\n\t\tif i%1000000 == 0 {\n\t\t\truntime.Gosched() // Explicitly yield the processor\n\t\t}\n\t\t_ = i * i\n\t}\n}",
    "verification": "Use 'go tool trace' to monitor goroutine preemption and check for long STW pauses in GC logs.",
    "date": "2026-02-14",
    "id": 1771060971,
    "type": "error"
});