window.onPostDataLoaded({
    "title": "Fixing Rust Async Cancellation Hazards",
    "slug": "rust-async-cancellation-hazards",
    "language": "Rust",
    "code": "RaceCondition",
    "tags": [
        "Rust",
        "Backend",
        "Tokio",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, an async `Future` can be dropped at any `await` point. This is known as 'cancellation.' If a future is performing a multi-step operation\u2014such as updating a shared state or writing to a socket\u2014and it is cancelled (e.g., via `tokio::select!` or a timeout), it may leave the system in an inconsistent state.</p><p>The hazard arises because the code after the current `await` is never executed, and any RAII guards held across the `await` might release resources prematurely or skip necessary cleanup logic.</p>",
    "root_cause": "The assumption that code following an `await` point is guaranteed to run, leading to partial state updates when a Future is dropped mid-execution.",
    "bad_code": "async fn process_order(db: Arc<Mutex<Db>>) {\n    let mut guard = db.lock().await;\n    guard.stage_1().await; // If cancelled here...\n    guard.stage_2().await; // ...this never runs, leaving stage_1 incomplete.\n}",
    "solution_desc": "Use an atomic state machine or a cleanup guard (RAII) that triggers on `Drop`. Alternatively, perform non-cancellable operations inside a spawned task that communicates back via a channel.",
    "good_code": "async fn process_order(db: Arc<Mutex<Db>>) {\n    let (tx, rx) = oneshot::channel();\n    tokio::spawn(async move {\n        let mut guard = db.lock().await;\n        guard.stage_1().await;\n        guard.stage_2().await;\n        let _ = tx.send(());\n    });\n    rx.await.expect(\"Task must complete\");\n}",
    "verification": "Run tests using `tokio-test` with manual polling to simulate drops at specific await points. Ensure shared state remains consistent.",
    "date": "2026-04-10",
    "id": 1775798325,
    "type": "error"
});