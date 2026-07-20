window.onPostDataLoaded({
    "title": "Fixing Rust Pinning Violations in Custom Futures",
    "slug": "fixing-rust-pinning-violations-custom-futures",
    "language": "Rust",
    "code": "PinningViolation",
    "tags": [
        "Rust",
        "Backend",
        "Asynchronous",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's async runtime model, futures are represented as state machines. If a future is self-referential (storing a pointer to its own fields), moving it in memory invalidates the pointer, causing severe memory corruption or undefined behavior. To mitigate this, Rust uses <code>std::pin::Pin</code>. A pinning violation occurs when unsafe code or custom manual poll implementations move a type that has been pinned, or fail to propagate pinning guarantees to structurally pinned fields. This breaks the safety guarantees of self-referential structures compiled under async/await blocks.</p>",
    "root_cause": "The root cause is structural movement of self-referential structs after pinning. When implementing a custom `Future` manually, implementing `poll` requires projecting `Pin<&mut Self>` to pinned or unpinned fields. Modifying or moving fields without proper pin-projection guarantees (for example, using `std::mem::replace` or swapping fields on a pinned reference) violates the pinning invariant.",
    "bad_code": "use std::future::Future;\nuse std::pin::Pin;\nuse std::task::{Context, Poll};\n\nstruct SelfReferential {\n    value: String,\n    pointer: *const String,\n}\n\nstruct MyFuture {\n    state: SelfReferential,\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n\n    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {\n        // BAD: Attempting to move or swap a field out of a pinned structure\n        // This bypasses the pinning invariant and can leave 'pointer' dangling.\n        let mut state = unsafe { &mut self.as_mut().get_unchecked_mut().state };\n        state.pointer = &state.value as *const String;\n        \n        // If MyFuture is moved after this, state.pointer points to old memory\n        Poll::Ready(())\n    }\n}",
    "solution_desc": "To fix pinning violations, use helper crates like `pin-project-lite` or `pin-project` to implement safe pin projection. Alternatively, dynamically allocate the self-referential structure on the heap using `Box::pin`, which guarantees that the heap address of the allocated data remains stable even if the outer future is moved.",
    "good_code": "use std::future::Future;\nuse std::pin::Pin;\nuse std::task::{Context, Poll};\nuse pin_project_lite::pin_project;\n\npin_project! {\n    // pin-project-lite safely handles structural pinning for MyFuture\n    struct MyFuture {\n        #[pin]\n        value: String,\n        // Keep pointer reference abstracted or safely boxed\n        pointer: Option<NonNullString>,\n    }\n}\n\nstruct NonNullString(std::ptr::NonNull<String>);\n\nimpl Future for MyFuture {\n    type Output = ();\n\n    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.project();\n        \n        // The value is pinned, and pointer configuration is safely managed\n        let val_ptr = unsafe { std::ptr::NonNull::new_unchecked(this.value.get_mut() as *mut String) };\n        *this.pointer = Some(NonNullString(val_ptr));\n        \n        Poll::Ready(())\n    }\n}",
    "verification": "Compile your library using Cargo. Run tests using `cargo test`. Ensure execution is clean under `miri` (`cargo miri test`) to dynamically detect any violations of the Rust memory model or invalid pointer aliasing/mutations of pinned memory.",
    "date": "2026-07-20",
    "id": 1784527224,
    "type": "error"
});