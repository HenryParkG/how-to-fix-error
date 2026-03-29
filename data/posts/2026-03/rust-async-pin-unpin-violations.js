window.onPostDataLoaded({
    "title": "Fixing Rust Async Pin-Unpin Violations in Streams",
    "slug": "rust-async-pin-unpin-violations",
    "language": "Rust",
    "code": "Pinning Error",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's asynchronous ecosystem, the <code>Stream</code> trait's <code>poll_next</code> method requires the receiver to be wrapped in <code>Pin<&mut Self></code>. This is essential for safety because async blocks often contain self-referential pointers that must not move in memory. A common violation occurs when developers try to implement a custom wrapper stream and attempt to access fields of the inner stream without proper pin projection, leading to compilation errors stating the type does not implement <code>Unpin</code>.</p>",
    "root_cause": "Attempting to call poll methods on a struct field that is not Unpin without using pin-projection to safely obtain a Pin<&mut Field>.",
    "bad_code": "struct MyStream<S> { inner: S }\n\nimpl<S: Stream> Stream for MyStream<S> {\n    type Item = S::Item;\n    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        // Error: cannot borrow field of pinned struct as mutable\n        self.inner.poll_next(cx)\n    }\n}",
    "solution_desc": "Use the 'pin-project' crate to create a safe projection of the pinned state from the parent struct to the internal field, allowing you to call poll_next on the inner stream.",
    "good_code": "use pin_project::pin_project;\n\n#[pin_project]\nstruct MyStream<S> {\n    #[pin]\n    inner: S,\n}\n\nimpl<S: Stream> Stream for MyStream<S> {\n    type Item = S::Item;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        let this = self.project();\n        this.inner.poll_next(cx)\n    }\n}",
    "verification": "Run 'cargo check'. The compiler will verify that the memory-safety guarantees are met via the generated projection code.",
    "date": "2026-03-29",
    "id": 1774776555,
    "type": "error"
});