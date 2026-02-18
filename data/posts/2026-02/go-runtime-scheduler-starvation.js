window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation in Numerical Loops",
    "slug": "go-runtime-scheduler-starvation",
    "language": "Go",
    "code": "ThreadLock",
    "tags": [
        "Go",
        "Backend",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>Go's runtime uses a cooperative/preemptive scheduler. However, tight numerical loops that do not contain function calls or system calls can sometimes prevent the scheduler from preempting the goroutine. If a G (goroutine) is stuck in a heavy calculation on a P (processor), other goroutines (like those handling HTTP health checks or GC) may starve, leading to application hangs despite low CPU utilization on other cores.</p>",
    "root_cause": "The Go 1.14+ asynchronous preemption relies on stack checks or signals; extremely tight loops without function calls can occasionally bypass these points.",
    "bad_code": "func tightLoop() {\n    for i := 0; i < 1e12; i++ {\n        // Pure numerical work with no function calls\n        res += i * i\n    }\n}",
    "solution_desc": "Manually yield the processor using 'runtime.Gosched()' or introduce a function call within the loop to allow the scheduler to insert a preemption point.",
    "good_code": "import \"runtime\"\n\nfunc looseLoop() {\n    for i := 0; i < 1e12; i++ {\n        res += i * i\n        if i%1000000 == 0 {\n            runtime.Gosched() // Explicitly yield to other goroutines\n        }\n    }\n}",
    "verification": "Run the application with GODEBUG=schedtrace=1000 and observe if all 'P' threads are making progress under load.",
    "date": "2026-02-18",
    "id": 1771407585,
    "type": "error"
});