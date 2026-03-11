window.onPostDataLoaded({
    "title": "Fixing Rust Async Pinning Violations in Custom Futures",
    "slug": "rust-async-pinning-violations",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, implementing a custom <code>Future</code> requires handling <code>Pin<&mut Self></code>. This is critical for self-referential structs where a pointer might point to another field within the same struct. If the struct is moved in memory, those internal pointers become dangling, leading to undefined behavior.</p><p>The compiler enforces pinning to guarantee that memory locations remain stable once a future has been polled. Violations usually occur when developers try to access fields of a pinned struct without proper projection.</p>",
    "root_cause": "Moving a type that does not implement Unpin after it has been pinned, or attempting to access fields of a Pinned struct as mutable references without using pin-projection.",
    "bad_code": "struct MyFuture { data: String, ptr: *const String }\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {\n        // Error: Cannot move out of pinned self to access fields\n        let this = self.get_mut(); \n        Poll::Ready(())\n    }\n}",
    "solution_desc": "Use the 'pin-project-lite' crate to safely project the Pin from the struct to its fields. This allows you to access fields without moving the whole structure, maintaining the pinning contract.",
    "good_code": "use pin_project_lite::pin_project;\n\npin_project! {\n    struct MyFuture {\n        #[pin]\n        field: SomeAsyncType,\n        data: String\n    }\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {\n        let this = self.project();\n        this.field.poll(cx)\n    }\n}",
    "verification": "Run 'cargo check'. If the code compiles, the pinning invariants are satisfied. Use 'miri' to detect potential undefined behavior in unsafe blocks.",
    "date": "2026-03-11",
    "id": 1773211257,
    "type": "error"
});