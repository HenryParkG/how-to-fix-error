window.onPostDataLoaded({
    "title": "Fixing Tokio Thread Starvation from Mutex Guards Across Await",
    "slug": "fixing-tokio-thread-starvation-async-mutex-guard-await",
    "language": "Rust",
    "code": "TokioThreadStarvation",
    "tags": [
        "Rust",
        "Tokio",
        "Async",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Rust microservices built on Tokio, holding std::sync::MutexGuard or improperly scoped tokio::sync::MutexGuard instances across .await boundaries causes worker thread starvation. When a task holds a sync lock and yields control back to the executor via an await, the thread executing that task remains blocked from picking up other tasks if the lock isn't yielding properly or if CPU work on the lock spans long periods.</p><p>Furthermore, std::sync::MutexGuard does not implement the Send trait in all context scopes, causing tasks to pin to specific worker threads or block executor workers entirely when awaiting network I/O. Under heavy concurrent load, this leads to exponential latency spikes and complete Tokio runtime stalls.</p>",
    "root_cause": "Holding a synchronous MutexGuard across an .await point prevents the Tokio runtime worker thread from processing other scheduled tasks, causing worker thread pool starvation.",
    "bad_code": "use std::sync::Mutex;\nuse std::sync::Arc;\n\nstruct SharedState {\n    counter: u64,\n}\n\nasync fn process_request(state: Arc<Mutex<SharedState>>) {\n    let mut guard = state.lock().unwrap();\n    guard.counter += 1;\n    \n    // CRITICAL BUG: Holding std::sync::MutexGuard across an .await point\n    tokio::time::sleep(std::time::Duration::from_millis(100)).await;\n    \n    println!(\"Updated count: {}\", guard.counter);\n}",
    "solution_desc": "Scope the mutex access strictly so that the lock guard is dropped before encountering any .await boundary. Alternatively, use tokio::sync::Mutex if the lock must be held across async operations, or minimize critical sections using atomic operations.",
    "good_code": "use std::sync::Mutex;\nuse std::sync::Arc;\n\nstruct SharedState {\n    counter: u64,\n}\n\nasync fn process_request(state: Arc<Mutex<SharedState>>) {\n    {\n        // Limit guard scope explicitly\n        let mut guard = state.lock().unwrap();\n        guard.counter += 1;\n    } // Guard is dropped here BEFORE yielding back to Tokio executor\n    \n    tokio::time::sleep(std::time::Duration::from_millis(100)).await;\n}",
    "verification": "Enable TOKIO_LINT or run under `tokio-console` to inspect worker thread yield times and confirm task poll duration metrics remain well under milliseconds without blocking thread workers.",
    "date": "2026-08-01",
    "id": 1785563179,
    "type": "error"
});