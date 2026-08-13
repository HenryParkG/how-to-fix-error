window.onPostDataLoaded({
    "title": "Fix Go Scheduler Deadlocks in Cgo Signal Handlers",
    "slug": "go-scheduler-deadlock-cgo-signal-handler",
    "language": "Go",
    "code": "GoDeadlockCgo",
    "tags": [
        "Go",
        "Cgo",
        "Concurrency",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>When executing POSIX signal handlers in C execution contexts via Cgo without proper Go runtime integration, the Go scheduler can stall completely. The Go runtime expects OS threads executing goroutines to be preemptible during garbage collection safepoints or sysmon checks. If a signal strikes during C execution context and the registered C signal handler blocks or invokes non-reentrant synchronization primitives without yielding back to the Go runtime, the Go STW (Stop-The-World) phase deadlocks indefinitely waiting for thread preemptibility.</p>",
    "root_cause": "Direct POSIX sigaction registration inside C code overrides Go's runtime signal handling infrastructure, preventing the asynchronous preemption signal (SIGURG) from being processed by the OS thread while inside C execution contexts.",
    "bad_code": "#include <signal.h>\n#include <pthread.h>\n\nstatic pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;\n\nvoid crash_handler(int sig) {\n    // DEADLOCK: Blocking on mutex inside C signal handler breaks Go scheduler\n    pthread_mutex_lock(&lock);\n    // Perform unsafe I/O operations\n    pthread_mutex_unlock(&lock);\n}\n\nvoid init_c_signals() {\n    struct sigaction sa;\n    sa.sa_handler = crash_handler;\n    sigemptyset(&sa.sa_mask);\n    sa.sa_flags = 0;\n    sigaction(SIGUSR1, &sa, NULL);\n}",
    "solution_desc": "Delegate signal handling entirely to Go's standard `os/signal` package or ensure C handlers avoid blocking runtime signals by reserving signals and invoking `cgocallback` safely without interrupting thread state.",
    "good_code": "package main\n\n/*\n#include <signal.h>\n// Expose non-blocking C functions only; signal handlers left to Go runtime\nvoid c_worker_function() {\n    // Long running C work without signal overrides\n}\n*/\nimport \"C\"\nimport (\n\t\"os\"\n\t\"os/signal\"\n\t\"syscall\"\n)\n\nfunc main() {\n\tsigChan := make(chan os.Signal, 1)\n\tsignal.Notify(sigChan, syscall.SIGUSR1)\n\n\tgo func() {\n\t\tfor sig := range sigChan {\n\t\t\t// Safely handled inside Go runtime scheduler\n\t\t\t_ = sig\n\t\t}\n\t}()\n\n\tC.c_worker_function()\n}",
    "verification": "Run application under stress testing using `GODEBUG=asyncpreemptoff=0` while repeatedly sending target signals via `kill -SIGUSR1 <pid>`. Verify GC STW pauses remain under 1ms.",
    "date": "2026-08-13",
    "id": 1786605246,
    "type": "error"
});