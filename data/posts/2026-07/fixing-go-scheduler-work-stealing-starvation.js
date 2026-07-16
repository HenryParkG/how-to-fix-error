window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Work-Stealing Starvation",
    "slug": "fixing-go-scheduler-work-stealing-starvation",
    "language": "Go",
    "code": "Latency/Starvation",
    "tags": [
        "Go",
        "Concurrency",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Go's GMP scheduler is highly efficient, but under high I/O concurrency combined with tight CPU-bound hot loops or raw blocking syscalls, it can suffer from work-stealing starvation. Idle logical processors (P) run out of runnable goroutines (G) in their local runqueues and spin in a costly work-stealing loop, while a few saturated processors hold onto a massive backlog of goroutines. This imbalance leads to severe tail latency amplification, where some requests process instantly while others wait hundreds of milliseconds for a scheduler quantum.</p>",
    "root_cause": "The Go scheduler relies heavily on cooperative preemption and async network polling. If a hot loop does not contain function calls (which contain compiler-inserted preemption checks), or if raw system calls are invoked directly bypassing the Go runtime's netpoll (e.g., via CGO or Direct syscalls), the active Goroutine (G) cannot be preempted. This blocks the operating system thread (M) and logical processor (P) from redistributing the runqueue load via work-stealing.",
    "bad_code": "package main\n\nimport (\n\t\"syscall\"\n)\n\nfunc readSocketRaw(fd int) []byte {\n\tbuf := make([]byte, 1024)\n\tfor {\n\t\t// Direct non-cooperative syscall blocks the OS thread (M) and logical processor (P)\n\t\tn, err := syscall.Read(fd, buf)\n\t\tif err == syscall.EAGAIN {\n\t\t\tcontinue // Tight loop without yield starves the scheduler\n\t\t}\n\t\tif err != nil || n > 0 {\n\t\t\treturn buf[:n]\n\t\t}\n\t}\n}",
    "solution_desc": "To fix scheduler starvation, convert raw, blocking system calls to non-blocking, runtime-integrated operations. Alternatively, use 'runtime.Gosched()' or explicit channel/mutex context switches to force the compiler to yield control. For CPU-bound loops, rely on Go 1.14+ asynchronous preemption, but ensure that register-only loops are broken up, or run them inside a dedicated worker pool with limited GOMAXPROCS concurrency.",
    "good_code": "package main\n\nimport (\n\t\"os\"\n\t\"runtime\"\n)\n\nfunc readSocketPolled(file *os.File) ([]byte, error) {\n\tbuf := make([]byte, 1024)\n\tfor {\n\t\t// os.File uses Go's integrated netpoll, yielding the P when blocked\n\t\tn, err := file.Read(buf)\n\t\tif err != nil {\n\t\t\treturn nil, err\n\t\t}\n\t\t// Explicitly yield execution to allow other goroutines to run\n\t\truntime.Gosched()\n\t\treturn buf[:n], nil\n\t}\n}",
    "verification": "Compile the binary and run with GODEBUG=schedtrace=1000. Observe if the runqueue lengths (runqueue=[...]) are balanced and that the number of idle threads (idletime) is minimized under high load.",
    "date": "2026-07-16",
    "id": 1784179941,
    "type": "error"
});