window.onPostDataLoaded({
    "title": "Fixing Rust Pinning Violations in Manual Futures",
    "slug": "rust-pinning-violations-manual-futures",
    "language": "Rust",
    "code": "PinningViolation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>Implementing the <code>Future</code> trait manually in Rust requires a deep understanding of memory safety and the <code>Pin</code> wrapper. A common violation occurs when a struct contains self-referential pointers or internal state that must not move in memory once a poll has started. If the type does not implement <code>Unpin</code>, moving the future after calling <code>poll</code> results in undefined behavior or compilation errors when using unsafe projection.</p>",
    "root_cause": "Attempting to move or reallocate a !Unpin type after its memory address has been stored in an internal pointer during the first poll invocation.",
    "bad_code": "struct MyFuture { data: String, ptr: *const u8 }\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {\n        self.ptr = self.data.as_ptr(); // UNSAFE: Moving self later invalidates ptr\n        Poll::Ready(())\n    }\n}",
    "solution_desc": "Use the 'pin-project' crate to safely project the pinned field or wrap the future in a Box::pin to heap-allocate and guarantee the memory location remains static.",
    "good_code": "use pin_project::pin_project;\n#[pin_project]\nstruct MyFuture { data: String }\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.project();\n        // 'this.data' is now safely pinned\n        Poll::Ready(())\n    }\n}",
    "verification": "Compile with 'cargo check' and run tests under Miri to detect potential memory safety violations in manual pinning logic.",
    "date": "2026-03-28",
    "id": 1774673296,
    "type": "error"
});