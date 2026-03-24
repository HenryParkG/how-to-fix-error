window.onPostDataLoaded({
    "title": "Resolving Soundness Issues in Manual Pin-Projection",
    "slug": "rust-pin-projection-soundness",
    "language": "Rust",
    "code": "Undefined Behavior",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust async programming, pinning is essential for self-referential structures. When manually implementing a <code>Future</code>, you often need to project a <code>Pin<&mut Struct></code> to a <code>Pin<&mut Field></code>. If the struct is <code>!Unpin</code>, manual projection can easily lead to soundness issues if the <code>Drop</code> implementation moves data that was assumed pinned, or if you expose a <code>&mut</code> to a field that should stay pinned.</p>",
    "root_cause": "Violating the 'Pin' contract by moving a field out of a pinned structure or failing to handle the Drop guarantee properly in manual implementations.",
    "bad_code": "struct MyFuture {\n    inner: SomeData,\n}\n\nimpl MyFuture {\n    fn project(self: Pin<&mut Self>) -> &mut SomeData {\n        unsafe { &mut self.get_unchecked_mut().inner }\n    }\n}",
    "solution_desc": "Use the 'pin-project-lite' crate to safely handle projection, or ensure that if a field is pinned, its containing struct's Drop implementation never moves it. The safe approach involves creating a projection struct that maintains the Pin wrapper.",
    "good_code": "use pin_project_lite::pin_project;\n\npin_project! {\n    struct MyFuture {\n        #[pin]\n        inner: SomeData,\n    }\n}\n\nimpl MyFuture {\n    fn do_something(self: Pin<&mut Self>) {\n        let this = self.project();\n        let _inner_pin: Pin<&mut SomeData> = this.inner;\n    }\n}",
    "verification": "Run 'cargo miri test' to detect undefined behavior and ensure no memory-related violations occur during polling.",
    "date": "2026-03-24",
    "id": 1774335236,
    "type": "error"
});