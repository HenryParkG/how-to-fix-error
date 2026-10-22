window.onPostDataLoaded({
    "title": "Fix Rust Async Cancellation Invariant Violations",
    "slug": "fix-rust-async-cancellation-invariant-violations",
    "language": "Rust",
    "code": "AsyncCancellationSafety",
    "tags": [
        "Rust",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Rust async runtimes such as Tokio, cancellation is cooperative and non-deterministic: a future is cancelled simply by dropping it at an <code>.await</code> yield point. This occurs frequently inside <code>tokio::select!</code> branches, timeout wrappers (<code>tokio::time::timeout</code>), or when tasks are aborted.</p><p>When an asynchronous routine performs a multi-step operation where state invariants are temporarily disrupted across an <code>.await</code> boundary, premature cancellation drops the task while invariants are broken. For example, popping an element from an in-memory queue or buffer and then awaiting a network flush leaves the system with lost data if the flush branch is cancelled before completion.</p>",
    "root_cause": "Splitting interdependent state mutations across non-atomic `.await` suspension points that are abruptly dropped during runtime future cancellation.",
    "bad_code": "use tokio::sync::mpsc;\n\npub async fn transfer_batch(rx: &mut mpsc::Receiver<Vec<u8>>, target: &mut NetworkSocket) {\n    // Non-cancellation-safe: Item is permanently pulled out of channel\n    while let Some(data) = rx.recv().await {\n        // If cancelled here by a timeout or select! branch,\n        // `data` is dropped and permanently lost from the system\n        target.write_all(&data).await.expect(\"failed to send\");\n    }\n}",
    "solution_desc": "Architect cancellation-safe state machines using atomic handoff protocols, RAII transaction guards that implement Drop rollback, or inspect channels using peek/borrow semantics so data is only committed and dequeued after all async I/O steps have succeeded.",
    "good_code": "use tokio::sync::mpsc;\n\npub struct RollbackBuffer<T> {\n    staged: Option<T>,\n}\n\npub async fn transfer_batch_safe(\n    rx: &mut mpsc::Receiver<Vec<u8>>,\n    target: &mut NetworkSocket,\n    stash: &mut RollbackBuffer<Vec<u8>>,\n) {\n    loop {\n        let data = match stash.staged.take() {\n            Some(pending) => pending,\n            None => match rx.recv().await {\n                Some(item) => item,\n                None => break,\n            },\n        };\n\n        // Stage item before non-atomic await: if cancelled, buffer retains it\n        stash.staged = Some(data);\n        target.write_all(stash.staged.as_ref().unwrap()).await.expect(\"failed to send\");\n        stash.staged = None; // Successfully committed\n    }\n}",
    "verification": "Construct a unit test using `tokio::select!` or `tokio-test` that repeatedly aborts the future mid-send, verifying that the payload remains accessible in the stash buffer and no messages are dropped across cancellation cycles.",
    "date": "2026-10-22",
    "id": 1792678472,
    "type": "error"
});