window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Preemption in CPU-Bound Loops",
    "slug": "go-scheduler-preemption-fix",
    "language": "Go",
    "code": "Latent Scheduling",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Prior to Go 1.14, the scheduler was cooperative, meaning a goroutine in a tight loop without function calls could hog a P (Processor) indefinitely, starving other goroutines and the garbage collector. While Go 1.14+ introduced asynchronous preemption via signals (SIGURG), specific tight loops\u2014especially those involving heavy numerical computation or those running on platforms with limited signal support\u2014can still exhibit high tail latency and GC stalls.</p>",
    "root_cause": "The compiler fails to insert a stack guard check (safepoint) in extremely tight loops, and the asynchronous preemption signal is either delayed or unable to interrupt the execution context effectively.",
    "bad_code": "func heavyWork() {\n    for i := 0; i < 1e12; i++ {\n        // Tight loop with no function calls\n        // Blocks the scheduler from preempting\n        count++ \n    }\n}",
    "solution_desc": "Explicitly invoke the scheduler to yield control in long-running loops or refactor the loop to include a function call that triggers the Go runtime's stack growth check (which doubles as a safepoint).",
    "good_code": "import \"runtime\"\n\nfunc heavyWork() {\n    for i := 0; i < 1e12; i++ {\n        if i%1000000 == 0 {\n            runtime.Gosched() // Manually yield to scheduler\n        }\n        count++\n    }\n}",
    "verification": "Use 'go tool trace' to visualize goroutine execution and verify that the CPU-bound task is being successfully preempted by other tasks or GC cycles.",
    "date": "2026-04-13",
    "id": 1776058414,
    "type": "error"
});