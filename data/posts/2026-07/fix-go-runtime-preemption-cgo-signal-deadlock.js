window.onPostDataLoaded({
    "title": "Fix Go Runtime Preemption Deadlock in Cgo Signals",
    "slug": "fix-go-runtime-preemption-cgo-signal-deadlock",
    "language": "Go",
    "code": "Deadlock / SIGSEGV",
    "tags": [
        "Go",
        "Backend",
        "Cgo",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>When Go programs execute native C functions via Cgo, the Go runtime decouples the OS thread (M) from the goroutine (G) scheduling context. Starting in Go 1.14, asynchronous preemption relies on Unix signals (specifically <code>SIGURG</code>) to preempt long-running goroutines. However, when C code invokes custom signal handlers or interacts with OS threads directly, asynchronous signal delivery can strike while thread-local storage or runtime lock invariants are in an intermediate state, freezing the OS thread in a non-reentrant deadlock.</p>",
    "root_cause": "The Go runtime's asynchronous preemption signal handling assumes full control over signal delivery state. If C code registers C-level signal handlers or modifies POSIX signal masks (`pthread_sigmask`) without preserving `SIGURG`, or executes non-async-signal-safe functions during runtime signal context switches, the Go runtime context switch hangs indefinitely awaiting state transitions back to `_Grunning`.",
    "bad_code": "package main\n\n/*\n#include <signal.h>\n#include <unistd.h>\n\nvoid unsafe_c_function() {\n    sigset_t mask;\n    sigfillset(&mask);\n    // Unsafe: Unconditionally blocks all signals including SIGURG\n    pthread_sigmask(SIG_SETMASK, &mask, NULL);\n    sleep(5); // Simulated heavy workload\n}\n*/\nimport \"C\"\nimport \"runtime\"\n\nfunc main() {\n    go func() {\n        for {\n            // Triggers Go runtime async preemption checks\n            runtime.GC()\n        }\n    }()\n    // Will deadlock when async preemption fires during C execution\n    C.unsafe_c_function()\n}",
    "solution_desc": "To fix this, preserve Go runtime signal masks by ensuring `SIGURG` (and internal runtime signals like `SIGSETXID`) are explicitly unblocked when setting C-level signal masks. Alternatively, isolate C execution threads using `runtime.LockOSThread()` or disable asynchronous preemption for the affected binary if low-level C thread isolation cannot be modified.",
    "good_code": "package main\n\n/*\n#include <signal.h>\n#include <unistd.h>\n\nvoid safe_c_function() {\n    sigset_t mask;\n    sigfillset(&mask);\n    // Unblock SIGURG so Go runtime async preemption works safely\n    sigdelset(&mask, 23); // SIGURG is typically 23 on Linux\n    pthread_sigmask(SIG_SETMASK, &mask, NULL);\n    sleep(5);\n}\n*/\nimport \"C\"\nimport \"runtime\"\n\nfunc main() {\n    runtime.LockOSThread()\n    defer runtime.UnlockOSThread()\n\n    safe_c_function()\n}",
    "verification": "Run the application with `GODEBUG=asyncpreemptoff=0,schedtrace=1000` under heavy concurrent workload. Verify via `pprof` stack traces that goroutines no longer block indefinitely on `runtime.cgocall` or `runtime.notesleep` calls.",
    "date": "2026-07-24",
    "id": 1784890445,
    "type": "error"
});