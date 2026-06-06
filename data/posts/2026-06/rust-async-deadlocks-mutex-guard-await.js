window.onPostDataLoaded({
    "title": "Fixing Rust Async Deadlocks: Mutex Across Await Points",
    "slug": "rust-async-deadlocks-mutex-guard-await",
    "language": "Rust",
    "code": "MutexGuard Held Across Await",
    "tags": [
        "Rust",
        "Concurrency",
        "Tokio",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In asynchronous Rust, tasks are cooperative units of execution multiplexed across a pool of operating system threads. When an <code>.await</code> point is reached, the current task yields control back to the executor, permitting other tasks to run. If a task holds a standard library mutex guard (<code>std::sync::MutexGuard</code>) when it yields at an <code>.await</code> boundary, it introduces several critical system vulnerabilities.</p><p>First, standard mutexes do not implement <code>Send</code> because they depend on thread-local locking primitives. If you hold this guard across an <code>.await</code>, the task future itself becomes non-<code>Send</code>, preventing it from being scheduled across multi-threaded runtimes like Tokio. Second, if the compiler does not block it (e.g., within single-threaded runtimes), the locked resource remains occupied while the executor resumes other tasks. If one of those newly resumed tasks attempts to acquire the same lock, it will block the entire OS thread, causing a complete application deadlock since the yielding task can never be scheduled to release the lock.</p>",
    "root_cause": "Holding a synchronous `std::sync::MutexGuard` across an asynchronous `.await` boundary, which prevents task yield completion, blocks the executor threads, and violates the thread safety constraints required by multithreaded task schedulers.",
    "bad_code": "use std::sync::Mutex;\nuse std::sync::Arc;\n\nstruct SharedState {\n    counter: Vec<i32>,\n}\n\nasync fn process_and_log(state: Arc<Mutex<SharedState>>) {\n    // Acquiring synchronous lock\n    let mut guard = state.lock().unwrap();\n    guard.counter.push(1);\n    \n    // CRITICAL BUG: .await point occurs while 'guard' is still in scope\n    external_network_call().await;\n    \n    guard.counter.push(2);\n} // guard is dropped here",
    "solution_desc": "Refactor the lock acquisition to limit its scope so that the lock is explicitly dropped before any `.await` point occurs. If long-term locking across asynchronous yield points is strictly required, replace the standard library synchronous `Mutex` with Tokio's asynchronous `tokio::sync::Mutex`.",
    "good_code": "use std::sync::Arc;\n// Solution A: Restrict synchronous scope\nasync fn process_and_log_scoped(state: Arc<std::sync::Mutex<SharedState>>) {\n    {\n        let mut guard = state.lock().unwrap();\n        guard.counter.push(1);\n    } // Guard is explicitly dropped here before yield\n    \n    external_network_call().await;\n    \n    {\n        let mut guard = state.lock().unwrap();\n        guard.counter.push(2);\n    }\n}\n\n// Solution B: Use Tokio's async-aware Mutex\nuse tokio::sync::Mutex as AsyncMutex;\n\nasync fn process_and_log_async(state: Arc<AsyncMutex<SharedState>>) {\n    // Async lock stays safe across yield points because its guard is Send\n    let mut guard = state.lock().await;\n    guard.counter.push(1);\n    \n    external_network_call().await; \n    \n    guard.counter.push(2);\n}",
    "verification": "Compile the application using the compiler flag `#![deny(clippy::await_holding_lock)]` to statically detect and prevent sync locks from being kept over await points, or use `tokio-console` to track lock acquisition delays.",
    "date": "2026-06-06",
    "id": 1780711942,
    "type": "error"
});