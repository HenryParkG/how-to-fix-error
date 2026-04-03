window.onPostDataLoaded({
    "title": "Fixing Rust Async Stream Cancellation Safety",
    "slug": "rust-async-stream-cancellation-safety",
    "language": "Rust",
    "code": "AsyncSafety",
    "tags": [
        "Rust",
        "Async",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Async cancellation in Rust is a 'stop-the-world' event. When a future or stream is dropped, it simply stops executing at its last <code>.await</code> or <code>poll</code> point. In complex pin-projected streams, this becomes a hazard when the internal state is left in an inconsistent half-written transition.</p><p>This often occurs when using the <code>pin-project</code> crate to manage internal projection of fields. If a stream is polled, reaches a point where it updates a state machine, and is then dropped before yielding a value, that state change might lead to resource leaks or logic errors upon subsequent attempts to reuse the underlying resources.</p>",
    "root_cause": "The root cause is the lack of 'on-drop' cleanup logic within manually implemented Poll methods, coupled with state transitions that occur before the stream yields Poll::Ready.",
    "bad_code": "impl Stream for MyStream {\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        let this = self.project();\n        if let Poll::Ready(val) = this.inner_future.poll(cx) {\n            // State changed here, but if the stream drops now,\n            // the change is lost and cleanup never happens.\n            *this.state = State::Processed;\n            return Poll::Ready(Some(val));\n        }\n        Poll::Pending\n    }\n}",
    "solution_desc": "To ensure cancellation safety, use the 'Drop' trait for cleanup or architect the stream so that state transitions only occur atomically with the return of a value. Wrap critical state in an Option or a dedicated state machine that can be recovered or safely dropped. Using high-level combinators like `stream::unfold` is generally safer than manual `Pin` projection.",
    "good_code": "impl Stream for MyStream {\n    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        let this = self.as_mut().project();\n        match this.inner_future.poll(cx) {\n            Poll::Ready(val) => {\n                // Ensure state transition and result are coupled\n                let result = Some(val);\n                *this.state = State::Idle;\n                Poll::Ready(result)\n            }\n            Poll::Pending => Poll::Pending,\n        }\n    }\n}\n// Ensure Drop is implemented if external resources need cleanup\nimpl Drop for MyStream {\n    fn drop(&mut self) { /* Cleanup logic here */ }\n}",
    "verification": "Use the 'tokio-test' crate to simulate dropping futures mid-execution and verify that resources (like file handles or sockets) are correctly released.",
    "date": "2026-04-03",
    "id": 1775179637,
    "type": "error"
});