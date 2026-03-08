window.onPostDataLoaded({
    "title": "Fixing Rust Pin Projection Violations in Manual Futures",
    "slug": "rust-pin-projection-violations-manual-futures",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>When implementing manual <code>Future</code> traits in Rust, developers must handle <code>Pin&lt;&amp;mut Self&gt;</code>. Pinning ensures that data types which are self-referential (common in async states) do not move in memory, which would invalidate internal pointers. A 'projection violation' occurs when you attempt to access a field of a pinned struct in a way that allows it to be moved or violates the pinning contract of that specific field.</p>",
    "root_cause": "Attempting to get a mutable reference (&mut T) to a field from a Pin<&mut Struct> without using safe projection, which could lead to moving a !Unpin type.",
    "bad_code": "impl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        // Error: cannot borrow field of pinned ref as mutable\n        let inner = &mut self.inner_future;\n        inner.poll(cx)\n    }\n}",
    "solution_desc": "Use the 'pin-project-lite' crate to safely project the Pin wrapper from the parent struct to its individual fields, respecting the Unpin requirements of each field.",
    "good_code": "use pin_project_lite::pin_project;\n\npin_project! {\n    struct MyFuture<F> {\n        #[pin]\n        inner_future: F,\n    }\n}\n\nimpl<F: Future> Future for MyFuture<F> {\n    type Output = F::Output;\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.project();\n        this.inner_future.poll(cx)\n    }\n}",
    "verification": "Run 'cargo check'. If projection is invalid, the compiler will throw a 'method not found' for .project() or a lifetime error regarding the pinned field.",
    "date": "2026-03-08",
    "id": 1772944139,
    "type": "error"
});