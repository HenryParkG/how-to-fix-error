window.onPostDataLoaded({
    "title": "Fixing Cancellation Safety in Rust Pin-Projected Futures",
    "slug": "rust-async-cancellation-safety-fix",
    "language": "Rust",
    "code": "AsyncSafetyViolation",
    "tags": [
        "Rust",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>Cancellation safety in Rust occurs when an asynchronous future is dropped before it completes. This is particularly dangerous when using <code>pin-project</code> to access internal fields. If a future is polled and makes partial progress (e.g., writing half a buffer) but is then dropped by a <code>select!</code> block, the internal state may be left in an inconsistent or 'poisoned' state that the next iteration cannot recover from.</p>",
    "root_cause": "The future holds state across yield points that is not resilient to being dropped, leading to data loss or invalid state when the future is recreated or wrapped in a loop.",
    "bad_code": "#[pin_project]\nstruct MyFuture<F> {\n    #[pin]\n    inner: F,\n    buf: Vec<u8>,\n}\n\nimpl<F: Future> Future for MyFuture<F> {\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.project();\n        // If inner is dropped after this point but before completion,\n        // data in 'buf' might be partially processed and lost.\n        this.inner.poll(cx)\n    }\n}",
    "solution_desc": "To ensure cancellation safety, move the state into a persistent structure that survives the drop, or use an Option to take ownership of the data so it can be returned or properly cleaned up if the future is cancelled.",
    "good_code": "impl<F: Future> Future for MyFuture<F> {\n    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        // Use a state machine to track progress\n        // and ensure buf is only modified on Poll::Ready\n        let this = self.as_mut().project();\n        match this.inner.poll(cx) {\n            Poll::Ready(res) => {\n                this.buf.clear();\n                Poll::Ready(res)\n            }\n            Poll::Pending => Poll::Pending,\n        }\n    }\n}",
    "verification": "Use the 'tokio-test' crate to simulate mid-poll drops and verify that the internal buffer remains consistent across multiple select! iterations.",
    "date": "2026-04-12",
    "id": 1775971015,
    "type": "error"
});