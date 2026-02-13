window.onPostDataLoaded({
    "title": "Rust Async Cancellation: Preventing Resource Leaks",
    "slug": "rust-async-cancellation-resource-leaks",
    "language": "Rust",
    "code": "AsyncCancellation",
    "tags": [
        "Rust",
        "Async",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's async ecosystem, futures can be dropped at any <code>.await</code> point, often due to a <code>tokio::select!</code> branch finishing first or a timeout triggering. If your code assumes that execution will always reach the line after an await, you risk leaving resources in an inconsistent state or leaking memory. This is particularly dangerous when manually managing state outside of RAII guards.</p>",
    "root_cause": "The runtime drops the Future object, causing its stack-allocated variables to be dropped immediately, which may bypass manual cleanup logic that was expected to run after the await point.",
    "bad_code": "async fn process_data(mutex: Arc<Mutex<State>>) {\n    let mut state = mutex.lock().await;\n    state.busy = true;\n    // If cancelled here, 'busy' remains true forever\n    do_io().await;\n    state.busy = false;\n}",
    "solution_desc": "Utilize RAII (Resource Acquisition Is Initialization) by creating a guard object that implements the Drop trait to ensure cleanup happens regardless of how the future terminates.",
    "good_code": "struct StateGuard<'a>(&'a Mutex<State>);\nimpl Drop for StateGuard<'_> {\n    fn drop(&mut self) { self.0.lock_blocking().busy = false; }\n}\n\nasync fn process_fixed(mutex: Arc<Mutex<State>>) {\n    let mut state = mutex.lock().await;\n    state.busy = true;\n    let _guard = StateGuard(&mutex);\n    do_io().await;\n    // _guard handles cleanup on success or cancellation\n}",
    "verification": "Use 'tokio-test' to wrap the future in a timeout and assert the state of the resource after the timeout occurs.",
    "date": "2026-02-13",
    "id": 1770965368,
    "type": "error"
});