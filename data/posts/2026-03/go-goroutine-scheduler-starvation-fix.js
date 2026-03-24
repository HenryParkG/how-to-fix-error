window.onPostDataLoaded({
    "title": "Resolving Goroutine Starvation in Non-Preemptive Loops",
    "slug": "go-goroutine-scheduler-starvation-fix",
    "language": "Go",
    "code": "SchedulerStarvation",
    "tags": [
        "Go",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Go versions prior to 1.14, the scheduler was strictly cooperative. Even in modern Go, certain tight loops that don't perform function calls or system calls can occasionally hinder the scheduler's ability to preempt a running goroutine. When a single goroutine enters a CPU-intensive tight loop, it can monopolize a logical processor (P), preventing other goroutines from being scheduled on that thread. This results in high latency for other tasks and can effectively freeze a concurrent application.</p>",
    "root_cause": "The Go scheduler relies on stack growth checks to trigger preemption. If a loop is tight and contains no function calls, the stack check is never reached, preventing the scheduler from context switching.",
    "bad_code": "func busyLoop() {\n\tfor {\n\t\t// Tight loop with no function calls\n\t\ti++ \n\t}\n}\n\nfunc main() {\n\truntime.GOMAXPROCS(1)\n\tgo busyLoop()\n\tfor {\n\t\tprintln(\"This might never print!\")\n\t\ttime.Sleep(time.Second)\n\t}\n}",
    "solution_desc": "While Go 1.14+ introduced asynchronous preemption via signals, it is still best practice to use runtime.Gosched() in long-running CPU-bound loops or ensure the loop performs work that triggers the scheduler, such as I/O or function calls.",
    "good_code": "func busyLoop() {\n\tfor {\n\t\ti++\n\t\t// Manually yield the processor\n\t\truntime.Gosched()\n\t}\n}\n\n// Alternative: Ensure Go 1.14+ features are not blocked by CGO/Syscalls",
    "verification": "Run the code with GOMAXPROCS=1. If the background goroutine allows the main loop to print, preemption or yielding is successful.",
    "date": "2026-03-24",
    "id": 1774314837,
    "type": "error"
});