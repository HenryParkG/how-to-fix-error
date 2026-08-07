window.onPostDataLoaded({
    "title": "Fixing Rust Tokio Runtime Deadlocks Across Await Points",
    "slug": "fixing-rust-tokio-deadlocks-across-await-points",
    "language": "Rust",
    "code": "Tokio Mutex Deadlock",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Tokio",
        "Error Fix"
    ],
    "analysis": "<p>In Rust asynchronous programming with Tokio, holding standard synchronous synchronization primitives such as <code>std::sync::MutexGuard</code> across an <code>.await</code> point is a common cause of runtime deadlocks and worker thread exhaustion.</p><p>Tokio uses a cooperative multi-threaded work-stealing scheduler with a fixed pool of worker threads (typically equal to the number of CPU cores). When a synchronous <code>std::sync::Mutex</code> is acquired, it locks the physical OS worker thread executing that task. If the task yields execution at an <code>.await</code> point while holding this guard, the underlying OS thread remains blocked from processing other queued async tasks. When multiple worker threads become blocked waiting on mutual lock acquisition across await boundaries, the Tokio runtime runs out of available threads to make progress on the suspended futures, causing a complete application freeze.</p>",
    "root_cause": "The standard `std::sync::MutexGuard` does not implement `Send` across yield points when Tokio suspends execution, keeping the worker thread parked and preventing task migration, leading to thread starvation deadlocks.",
    "bad_code": "use std::sync::Mutex;\nuse std::sync::Arc;\nuse tokio::time::{sleep, Duration};\n\nstruct SharedState {\n    counter: u64,\n}\n\nasync fn process_request(state: Arc<Mutex<SharedState>>) {\n    // BUG: Standard std::sync::MutexGuard held across .await point\n    let mut guard = state.lock().unwrap();\n    guard.counter += 1;\n    \n    // Suspends task execution while holding synchronous thread-blocking lock\n    sleep(Duration::from_millis(100)).await;\n    \n    println!(\"Updated counter: {}\", guard.counter);\n}",
    "solution_desc": "To resolve Tokio worker thread deadlocks, avoid holding synchronous guards across `.await` boundaries. You can either scoping the synchronous lock to drop before the `.await` point or replace `std::sync::Mutex` with `tokio::sync::Mutex`, which asynchronously yields lock acquisition without blocking OS worker threads.",
    "good_code": "use tokio::sync::Mutex;\nuse std::sync::Arc;\nuse tokio::time::{sleep, Duration};\n\nstruct SharedState {\n    counter: u64,\n}\n\n// Solution 1: Use Tokio's async-aware Mutex\nasync fn process_request_async_mutex(state: Arc<Mutex<SharedState>>) {\n    let mut guard = state.lock().await;\n    guard.counter += 1;\n    sleep(Duration::from_millis(100)).await;\n    println!(\"Updated counter: {}\", guard.counter);\n}\n\n// Solution 2: Explicitly scope std::sync::MutexGuard to drop before await\nasync fn process_request_scoped(state: Arc<std::sync::Mutex<SharedState>>) {\n    {\n        let mut guard = state.lock().unwrap();\n        guard.counter += 1;\n    } // Lock dropped here\n    \n    sleep(Duration::from_millis(100)).await;\n}",
    "verification": "Run `cargo clippy` to check for `clippy::await_holding_lock` lints. Verify fix using Tokio Console (`tokio-console`) to ensure worker threads maintain high active utilization without entering blocked states under sustained load tests.",
    "date": "2026-08-07",
    "id": 1786068518,
    "type": "error"
});