window.onPostDataLoaded({
    "title": "Fix Go Runtime Scheduler Starvation in Tight Loops",
    "slug": "go-runtime-scheduler-starvation",
    "language": "Go",
    "code": "SCHEDULER_STARVATION",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>The Go runtime uses an M:N scheduler to multiplex G goroutines onto M operating system threads. Historically, the scheduler relied on cooperative preemption, which inserted preemption checks at function prologues. If a goroutine ran a tight numerical computation loop without any function calls, it could run indefinitely on its OS thread without yielding, starving other goroutines and blocking Garbage Collection (GC) sweeps.</p><p>While Go 1.14 introduced non-cooperative preemption using OS signals (`SIGURG`), starvation bugs still occur in environments where signals are disabled, on architectures with limited platform support, or during extremely tight loops that manipulate pointer-heavy registers where the compiler cannot safely inject preemption points.</p>",
    "root_cause": "A tight loop executing math or CPU-heavy work without function calls blocks the runtime scheduler on that specific OS thread, preventing the execution of garbage collection cycles, system monitor checks, or pending concurrent goroutines.",
    "bad_code": "package main\n\nimport \"runtime\"\n\nfunc main() {\n\truntime.GOMAXPROCS(1) // Set to 1 to easily demonstrate starvation\n\n\tgo func() {\n\t\t// Tight loop with no function calls prevents other goroutines from running\n\t\ti := 0\n\t\tfor {\n\t\t\ti++\n\t\t}\n\t}()\n\n\t// This will never be scheduled in pre-1.14 or under signal-blocked systems\n\tprintln(\"Waiting for goroutine...\")\n\tselect {}\n}",
    "solution_desc": "Insert manual preemption checks using `runtime.Gosched()` inside compute-heavy loops, or refactor loops to allow natural preemption points (such as channels or standard function invocations). Alternatively, configure compiler flags or runtime settings to ensure signal-based preemption is functional.",
    "good_code": "package main\n\nimport \"runtime\"\n\nfunc main() {\n\truntime.GOMAXPROCS(1)\n\n\tgo func() {\n\t\ti := 0\n\t\tfor {\n\t\t\ti++\n\t\t\t// Explicitly yield execution back to the Go scheduler\n\t\t\tif i%1000000 == 0 {\n\t\t\t\truntime.Gosched()\n\t\t\t}\n\t\t}\n\t}()\n\n\t// Correctly prints and resolves starvation because loop cooperatively yields\n\tprintln(\"Scheduler successfully context-switches!\")\n}",
    "verification": "Compile with `go build` and execute on a single CPU core (`GOMAXPROCS=1`). Use `go tool trace` to capture runtime events and confirm that context switches occur regularly and goroutines are not starved for more than a few milliseconds.",
    "date": "2026-05-26",
    "id": 1779777560,
    "type": "error"
});