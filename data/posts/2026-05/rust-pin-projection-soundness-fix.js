window.onPostDataLoaded({
    "title": "Fixing Soundness in Manual Pin Projections for Rust",
    "slug": "rust-pin-projection-soundness-fix",
    "language": "Rust",
    "code": "SoundnessViolation",
    "tags": [
        "Rust",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>When building custom async state machines or futures in Rust, developers often need to project a <code>Pin<&mut Struct></code> to a <code>Pin<&mut Field></code>. Manual implementation of this pattern is notoriously difficult to get right. The core issue arises when a field is structurally pinned, but the implementation allows the field to be moved after it has been pinned, violating the Pin contract. This often happens if the developer provides a <code>get_unchecked_mut</code> access without ensuring the field itself doesn't implement <code>Unpin</code> unexpectedly, or if <code>Drop</code> is implemented in a way that moves the pinned data.</p>",
    "root_cause": "The implementation failed to enforce that the struct does not implement 'Unpin' if any of its structurally pinned fields are not 'Unpin', and it allowed mutable access to pinned fields through a non-pinned reference.",
    "bad_code": "struct MyFuture<T> {\n    inner: T,\n}\n\nimpl<T> MyFuture<T> {\n    fn project(self: Pin<&mut Self>) -> Pin<&mut T> {\n        unsafe { self.map_unchecked_mut(|s| &mut s.inner) }\n    }\n}\n// Violation: If T is !Unpin, MyFuture<T> must not be Unpin,\n// but Rust auto-implements Unpin for MyFuture<T>.",
    "solution_desc": "Use the 'pin-project-lite' crate to safely handle projections or manually add a 'PhantomPinned' marker and ensure that the struct's Unpin implementation is conditional on the field's Unpin implementation.",
    "good_code": "use pin_project_lite::pin_project;\n\npin_project! {\n    struct MyFuture<T> {\n        #[pin]\n        inner: T,\n    }\n}\n\nimpl<T> MyFuture<T> {\n    fn do_something(self: Pin<&mut Self>) {\n        let this = self.project();\n        let _pinned_inner: Pin<&mut T> = this.inner;\n    }\n}",
    "verification": "Run 'cargo miri test' to detect undefined behavior and memory violations related to pinning.",
    "date": "2026-05-10",
    "id": 1778399867,
    "type": "error"
});