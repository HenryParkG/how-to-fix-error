window.onPostDataLoaded({
    "title": "Fixing Rust Pinning Violations in Async Futures",
    "slug": "rust-pinning-violations-async-futures",
    "language": "Rust",
    "code": "PinningViolation",
    "tags": [
        "Rust",
        "Async",
        "Safety",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, async functions generate state machines that often contain self-referential pointers (e.g., a reference to a variable stored within the same future's stack frame). If such a future is moved in memory after it has started executing, those internal pointers become dangling, leading to undefined behavior.</p><p>The <code>Pin</code> wrapper is designed to guarantee that the data it points to will not be moved until it is dropped, ensuring the safety of these self-references.</p>",
    "root_cause": "Moving a self-referential future after polling has begun, invalidating internal memory addresses.",
    "bad_code": "struct MyFuture {\n    data: String,\n    ptr: *const String,\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<()> {\n        // If 'self' moves, 'ptr' becomes invalid\n        println!(\"{:?}\", unsafe { &*self.ptr });\n        Poll::Ready(())\n    }\n}",
    "solution_desc": "Use the `pin_project` crate or `Box::pin` to ensure the future is heap-allocated and its memory location is stable throughout its lifecycle.",
    "good_code": "use pin_project::pin_project;\n\n#[pin_project]\nstruct MyFuture {\n    data: String,\n    #[pin]\n    inner_future: tokio::time::Sleep,\n}\n\n// Usage: let pinned_fut = Box::pin(MyFuture { ... });",
    "verification": "Run `cargo test` and use `Miri` (cargo miri test) to detect potential memory safety violations and invalid pointer dereferences.",
    "date": "2026-03-09",
    "id": 1773049189,
    "type": "error"
});