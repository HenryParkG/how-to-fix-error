window.onPostDataLoaded({
    "title": "Debugging Rust Pin-Projection in Custom Async Streams",
    "slug": "rust-pin-projection-async-stream-fix",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's async ecosystem, implementing a custom <code>Stream</code> often requires wrapping an internal future or another stream. Because <code>Stream::poll_next</code> receives <code>Pin<&mut Self></code>, you cannot easily access internal fields that also require pinning without violating the structural pinning invariants. Many developers attempt to use <code>std::mem::replace</code> or direct field access, which leads to compilation errors because the compiler cannot guarantee the field won't be moved.</p>",
    "root_cause": "Attempting to access a field of a pinned struct as pinned (structural pinning) without implementing safe projection, leading to a mismatch between Pin<&mut Wrapper> and the required Pin<&mut Field>.",
    "bad_code": "struct MyStream<S> { inner: S }\n\nimpl<S: Stream> Stream for MyStream<S> {\n    type Item = S::Item;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        // Error: cannot borrow field of pinned struct\n        self.inner.poll_next(cx)\n    }\n}",
    "solution_desc": "Use the `pin-project-lite` crate to safely project the `Pin` from the wrapper struct to its internal fields. This generates a 'Projected' proxy struct that handles the unsafe pointer arithmetic required to maintain pinning guarantees.",
    "good_code": "use pin_project_lite::pin_project;\n\npin_project! {\n    struct MyStream<S> {\n        #[pin]\n        inner: S\n    }\n}\n\nimpl<S: Stream> Stream for MyStream<S> {\n    type Item = S::Item;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        let this = self.project();\n        this.inner.poll_next(cx)\n    }\n}",
    "verification": "Run `cargo check`. If the project compiles without 'cannot borrow as mutable' errors when calling poll methods, the projection is correct.",
    "date": "2026-05-08",
    "id": 1778206046,
    "type": "error"
});