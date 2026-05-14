window.onPostDataLoaded({
    "title": "Resolving Rust Async Stream Pinning Violations",
    "slug": "rust-async-stream-pinning-violations",
    "language": "Rust",
    "code": "PinningViolation",
    "tags": [
        "Rust",
        "Async",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, implementing the <code>Stream</code> trait manually requires handling the <code>poll_next</code> method, which receives a <code>Pin<&mut Self></code>. A common violation occurs when the struct contains internal futures or other streams that are not <code>Unpin</code>. Because the wrapper struct is pinned, its fields are also effectively pinned, and moving them (or calling methods that require <code>&mut self</code>) violates memory safety guarantees unless proper 'pin projection' is used.</p>",
    "root_cause": "Attempting to access or poll an internal field of a pinned struct without using pin-projection, which is required because the compiler cannot guarantee the field won't be moved if accessed via a normal mutable reference.",
    "bad_code": "impl Stream for MyStream {\n    type Item = String;\n    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        // Error: cannot borrow field `inner` as mutable because it is behind a Pin\n        self.inner.poll_next(cx) \n    }\n}",
    "solution_desc": "Use the `pin-project-lite` crate to safely project the `Pin<&mut Self>` to a `Pin<&mut Field>`. This allows you to call poll methods on internal fields without violating safety rules.",
    "good_code": "use pin_project_lite::pin_project;\n\npin_project! {\n    struct MyStream<S> {\n        #[pin]\n        inner: S,\n    }\n}\n\nimpl<S: Stream> Stream for MyStream<S> {\n    type Item = S::Item;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        let this = self.project();\n        this.inner.poll_next(cx)\n    }\n}",
    "verification": "Compile the code using `cargo check`. If pin-projection is correctly implemented, the compiler will no longer throw 'cannot borrow as mutable' errors for pinned fields.",
    "date": "2026-05-14",
    "id": 1778756984,
    "type": "error"
});