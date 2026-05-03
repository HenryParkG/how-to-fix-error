window.onPostDataLoaded({
    "title": "Resolving Rust Pinning Violations in Async Streams",
    "slug": "rust-async-stream-pinning-violations",
    "language": "Rust",
    "code": "PinningViolation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>When implementing a custom <code>Stream</code> in Rust, developers frequently encounter pinning violations. The <code>poll_next</code> method requires <code>Self</code> to be wrapped in a <code>Pin</code>. This is essential for futures that might contain self-referential pointers, ensuring they aren't moved in memory after they start executing. However, accessing internal fields of a pinned struct requires careful projection, which many developers attempt to do via manual pointer manipulation, leading to safety violations or compiler errors.</p>",
    "root_cause": "The compiler prevents moving fields out of a pinned struct because doing so would invalidate any self-referential pointers within those fields. Without 'pin projection', you cannot access mutable references to fields of a pinned struct.",
    "bad_code": "impl Stream for MyStream {\n    type Item = String;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        // Error: Cannot move out of pinned self\n        let this = self.get_mut(); \n        this.inner_future.poll(cx)\n    }\n}",
    "solution_desc": "Use the 'pin-project-lite' or 'pin-project' crate to safely project pinning from the parent struct to its fields. This generates a 'Projected' proxy struct that allows safe access to internal pinned fields without manual unsafe blocks.",
    "good_code": "use pin_project_lite::pin_project;\n\npin_project! {\n    struct MyStream<F> {\n        #[pin]\n        inner_future: F,\n    }\n}\n\nimpl<F: Future> Stream for MyStream<F> {\n    type Item = F::Output;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        let this = self.project();\n        match this.inner_future.poll(cx) {\n            Poll::Ready(v) => Poll::Ready(Some(v)),\n            Poll::Pending => Poll::Pending,\n        }\n    }\n}",
    "verification": "Run 'cargo check'. The code should compile without 'cannot move out of pinned' errors. Use 'tokio::spawn' to ensure the stream remains Send and correctly pinned during execution.",
    "date": "2026-05-03",
    "id": 1777787423,
    "type": "error"
});