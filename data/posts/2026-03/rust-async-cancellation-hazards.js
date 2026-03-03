window.onPostDataLoaded({
    "title": "Mitigating Rust Async Cancellation Hazards",
    "slug": "rust-async-cancellation-hazards",
    "language": "Rust",
    "code": "AsyncCancellationError",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Rust's async model is based on polling; a future can be dropped at any <code>.await</code> point. This is 'cancellation'. In complex state-machine orchestrators, if a future is dropped while it holds an intermediate state (e.g., after modifying a local cache but before updating a database), the system can be left in an inconsistent state. This is particularly dangerous when using <code>tokio::select!</code>, which drops all unfinished branches as soon as one completes.</p>",
    "root_cause": "Assuming that code following an .await will always execute, and failing to use 'Drop' guards or atomic state transitions for critical operations.",
    "bad_code": "async fn transition_state(state: &mut State) {\n    tokio::select! {\n        _ = socket.write_all(data) => {\n            // If this completes, we update state\n            state.sent_count += 1;\n        }\n        _ = timeout(Duration::from_secs(1)) => {\n            // If timeout hits, the write_all future is dropped mid-stream!\n            return;\n        }\n    }\n}",
    "good_code": "async fn transition_state(state: &mut State) {\n    // Use a completion-based approach or ensure state updates are atomic\n    let result = tokio::time::timeout(Duration::from_secs(1), socket.write_all(data)).await;\n    \n    if let Ok(Ok(_)) = result {\n        state.sent_count += 1;\n    }\n    // State only changes after the future successfully completes\n}",
    "solution_desc": "Avoid using select! over futures that perform non-idempotent side effects. Use specialized structures like 'Oneshot' channels for completion signaling or wrap state in Mutexes that are only updated post-completion.",
    "verification": "Implement property-based tests using 'loom' or simulate high-concurrency drops to ensure state invariants hold.",
    "date": "2026-03-03",
    "id": 1772530405,
    "type": "error"
});