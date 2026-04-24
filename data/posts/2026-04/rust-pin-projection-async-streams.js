window.onPostDataLoaded({
    "title": "Rust Pin Projection Safety in Async Streams",
    "slug": "rust-pin-projection-async-streams",
    "language": "Rust",
    "code": "PinSafetyError",
    "tags": [
        "Rust",
        "Async",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When manually implementing the <code>Stream</code> trait in Rust, developers must handle <code>Pin<&mut Self></code>. A common failure occurs when projecting this pinned reference to internal fields. If a field is not <code>Unpin</code>, moving it after projection violates the pinning contract, potentially leading to undefined behavior or memory unsafety during polling.</p>",
    "root_cause": "Violating the Pin invariant by creating a mutable reference to a field that should remain pinned, without using safe projection wrappers.",
    "bad_code": "impl Stream for MyStream {\n    type Item = String;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        // ERROR: This field might need to be pinned too!\n        let inner = unsafe { &mut self.get_unchecked_mut().inner };\n        inner.poll_next(cx)\n    }\n}",
    "solution_desc": "Use the `pin-project` crate to safely project the `Pin` from the outer struct to its fields. This macro-based approach ensures that field access respects the `Unpin` requirements of the underlying data types.",
    "good_code": "use pin_project::pin_project;\n\n#[pin_project]\nstruct MyStream<S> {\n    #[pin]\n    inner: S,\n}\n\nimpl<S: Stream> Stream for MyStream<S> {\n    type Item = S::Item;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        let this = self.project();\n        this.inner.poll_next(cx)\n    }\n}",
    "verification": "Compile with 'cargo check'. The borrow checker and pin-project macros will ensure no illegal moves occur on fields marked with #[pin].",
    "date": "2026-04-24",
    "id": 1777016974,
    "type": "error"
});