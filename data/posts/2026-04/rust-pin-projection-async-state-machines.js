window.onPostDataLoaded({
    "title": "Fixing Rust Pin-Projection Invariants in Manual Async",
    "slug": "rust-pin-projection-async-state-machines",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>When manually implementing <code>Future</code>, developers often encounter the 'Pin-Projection' problem. Rust's memory safety guarantees rely on the invariant that if a value is <code>Pinned</code>, it will never move in memory before being dropped.</p><p>In manual state machines, you must project <code>Pin<&mut Self></code> to <code>Pin<&mut Field></code>. If done incorrectly, you might accidentally move a field that was supposed to stay pinned, or fail to uphold the drop guarantee, leading to undefined behavior or compilation errors when working with self-referential structures.</p>",
    "root_cause": "Violating structural pinning requirements or attempting to move a field out of a pinned struct without the field being 'Unpin'.",
    "bad_code": "struct MyFuture {\n    inner: SomeOtherFuture,\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        // Error: cannot borrow field of pinned struct as mutable without projection\n        self.inner.poll(cx)\n    }\n}",
    "solution_desc": "Use the 'pin-project' crate to safely project pinning from a struct to its fields, ensuring that the 'Unpin' trait is correctly handled and that the drop-move invariants are maintained automatically.",
    "good_code": "use pin_project::pin_project;\n\n#[pin_project]\nstruct MyFuture {\n    #[pin]\n    inner: SomeOtherFuture,\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.project();\n        this.inner.poll(cx) // Safely projected to Pin<&mut SomeOtherFuture>\n    }\n}",
    "verification": "Compile the code and run with 'cargo miri test' to verify there are no pointer or memory aliasing violations at runtime.",
    "date": "2026-04-08",
    "id": 1775632108,
    "type": "error"
});