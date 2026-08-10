window.onPostDataLoaded({
    "title": "Fix Tokio Async Starvation from Sync Mutexes in Rust",
    "slug": "fix-tokio-async-thread-starvation-sync-mutex-rust",
    "language": "Rust",
    "code": "TokioStarvation",
    "tags": [
        "Rust",
        "Tokio",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's Tokio runtime, multi-threaded task schedulers rely on cooperative yielding across await points to share a fixed pool of worker threads. Holding a synchronous <code>std::sync::MutexGuard</code> across an <code>.await</code> point blocks the underlying OS worker thread entirely, preventing Tokio from yielding execution to other tasks scheduled on the same worker queue.</p><p>Under high load, this pattern leads to rapid worker thread starvation. Tasks backed up behind the blocking mutex block all concurrent tasks assigned to that thread, spiraling into unbounded queue latency and deadlocking worker threads across the runtime pool.</p>",
    "root_cause": "Holding a blocking std::sync::MutexGuard across asynchronous await points prevents Tokio worker threads from context-switching, starving other concurrent futures mapped to the same thread.",
    "bad_code": "use std::sync::Mutex;\nuse std::sync::Arc;\n\nstruct SharedState {\n    counter: u64,\n}\n\nasync fn process_request(state: Arc<Mutex<SharedState>>) {\n    // DANGER: Holding std::sync::MutexGuard across an await point\n    let mut lock = state.lock().unwrap();\n    lock.counter += 1;\n    \n    // Worker thread blocked during network I/O yield!\n    tokio::time::sleep(std::time::Duration::from_millis(100)).await;\n    \n    println!(\"Count: {}\", lock.counter);\n}",
    "solution_desc": "To fix thread starvation, replace std::sync::Mutex with tokio::sync::Mutex if the lock must be held across await points. Alternatively, keep std::sync::Mutex but scope the guard so it is explicitly dropped before any await point is encountered.",
    "good_code": "use tokio::sync::Mutex;\nuse std::sync::Arc;\n\nstruct SharedState {\n    counter: u64,\n}\n\nasync fn process_request(state: Arc<Mutex<SharedState>>) {\n    // Fixed: tokio::sync::Mutex yields thread ownership during await\n    let mut lock = state.lock().await;\n    lock.counter += 1;\n    \n    tokio::time::sleep(std::time::Duration::from_millis(100)).await;\n    \n    println!(\"Count: {}\", lock.counter);\n}",
    "verification": "Inspect runtime metrics using tokio-console or run Tokio with RUSTFLAGS=\"--cfg tokio_unstable\" to track task execution times and detect worker thread blocking durations.",
    "date": "2026-08-10",
    "id": 1786356543,
    "type": "error"
});