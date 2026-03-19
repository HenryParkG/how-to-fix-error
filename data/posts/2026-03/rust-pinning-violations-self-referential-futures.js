window.onPostDataLoaded({
    "title": "Fixing Rust Pinning Violations in Async Futures",
    "slug": "rust-pinning-violations-self-referential-futures",
    "language": "Rust",
    "code": "PinningViolation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, self-referential structs are fundamentally dangerous because moving the struct in memory invalidates internal pointers. This is a common issue when manually implementing <code>Future</code> or <code>Stream</code>. When a future is polled, it may create references to its own data; if that future is then moved (e.g., via <code>mem::swap</code> or moving into a different scope), those references become dangling pointers, leading to undefined behavior or memory corruption.</p>",
    "root_cause": "The default behavior of Rust types is that they are 'Unpin', meaning they can be moved safely. For self-referential types, this movement breaks internal memory addresses, violating the safety guarantees required by the 'Pin' wrapper.",
    "bad_code": "struct MyFuture {\n    data: String,\n    ptr: *const String,\n}\n\nimpl MyFuture {\n    fn init(&mut self) {\n        self.ptr = &self.data; // Self-reference\n    }\n}\n// Moving this struct after init() invalidates ptr.",
    "solution_desc": "Utilize the 'Pin' type to guarantee that the memory location of the data remains fixed. Use the 'pin-project' crate to safely handle field projection without needing unsafe code, ensuring that the self-referential fields are never moved after the first poll.",
    "good_code": "use pin_project::pin_project;\nuse std::pin::Pin;\n\n#[pin_project]\nstruct MyFuture {\n    data: String,\n    // Internal pointers are avoided in favor of safe projections\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {\n        let this = self.project();\n        // 'this.data' is now safely pinned\n        Poll::Ready(())\n    }\n}",
    "verification": "Compile using 'cargo check'. Run tests under Miri using 'cargo miri test' to detect any experimental undefined behavior or pointer invalidations during future execution.",
    "date": "2026-03-19",
    "id": 1773895805,
    "type": "error"
});