window.onPostDataLoaded({
    "title": "Fix Rust Async Cancellation Safety & State Corruption",
    "slug": "fixing-rust-async-cancellation-safety-violations",
    "language": "Rust",
    "code": "CancellationSafetyError",
    "tags": [
        "Rust",
        "Async",
        "Tokio",
        "Error Fix"
    ],
    "analysis": "<p>In Rust async runtime models like Tokio, futures can be dropped at any <code>.await</code> point when dropped by callers using functions like <code>tokio::select!</code> or <code>tokio::time::timeout</code>. If a future holds intermediate invariant-violating state across an <code>.await</code> point before completing a full logical operation, dropping that future leaves shared state or underlying stream corrupted.</p><p>Cancellation safety requires that dropping a future mid-execution does not leave shared data structures in an inconsistent state or cause lost data on socket reads. Standard patterns like acquiring Mutex guards or mutating multi-step structures across yields frequently trigger subtle state leaks.</p>",
    "root_cause": "Holding inconsistent state or partially drained buffer states across yield points (.await) in tasks wrapped by tokio::select! or timeout macros, causing state corruption when the future is dropped before completion.",
    "bad_code": "use tokio::sync::Mutex;\nuse std::sync::Arc;\n\nstruct SharedState {\n    buffer: Vec<u8>,\n    is_processing: bool,\n}\n\nasync fn process_data(state: Arc<Mutex<SharedState>>) {\n    let mut guard = state.lock().await;\n    guard.is_processing = true;\n    // Unsafe await boundary: dropping here leaves is_processing = true forever\n    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;\n    guard.buffer.clear();\n    guard.is_processing = false;\n}",
    "solution_desc": "Decouple state mutations into atomic updates or spawn background tasks via channels so that cancellation of the consumer handle does not abort the background execution loop mid-transaction.",
    "good_code": "use tokio::sync::{mpsc, Mutex};\nuse std::sync::Arc;\n\nstruct SharedState {\n    buffer: Vec<u8>,\n}\n\n// Offload work to spawned task; dropping channel handle stops queue gracefully\nasync fn process_worker(mut rx: mpsc::Receiver<Vec<u8>>, state: Arc<Mutex<SharedState>>) {\n    while let Some(data) = rx.recv().await {\n        let mut guard = state.lock().await;\n        // Synchronous atomic state update across data without await yield points\n        guard.buffer.extend(data);\n        guard.buffer.clear();\n    }\n}",
    "verification": "Run concurrent unit tests using tokio::time::pause() and tokio::select! with fast cancellation intervals while asserting state invariants.",
    "date": "2026-08-03",
    "id": 1785722071,
    "type": "error"
});