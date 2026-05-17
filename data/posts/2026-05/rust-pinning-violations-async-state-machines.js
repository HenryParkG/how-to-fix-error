window.onPostDataLoaded({
    "title": "Fixing Rust Pinning Violations in Async States",
    "slug": "rust-pinning-violations-async-state-machines",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>When manually implementing the <code>Future</code> trait in Rust, developers often encounter pinning violations. This usually happens when a custom state machine contains internal references or self-referential pointers that are moved in memory after the future has been polled. Rust's <code>Pin</code> type is designed to guarantee that the data at a specific memory address remains stationary, but improper use of <code>unsafe</code> or <code>Box::pin</code> can bypass these safeguards, leading to undefined behavior or memory corruption.</p>",
    "root_cause": "The state machine is moved in memory after a pointer to its internal state has been created and stored, invalidating that pointer.",
    "bad_code": "struct MyFuture {\n    data: String,\n    ptr: *const String,\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {\n        self.ptr = &self.data; // Error: Moving 'self' later invalidates 'ptr'\n        Poll::Ready(())\n    }\n}",
    "solution_desc": "Use the `PhantomPinned` marker to make the type `!Unpin` and ensure internal references are only established within a pinned context. Use `Pin::get_unchecked_mut` only when safety invariants are manually verified.",
    "good_code": "use std::marker::PhantomPinned;\nuse std::pin::Pin;\n\nstruct MyFuture {\n    data: String,\n    ptr: Option<*const String>,\n    _pin: PhantomPinned,\n}\n\nimpl MyFuture {\n    fn new(s: String) -> Self {\n        Self { data: s, ptr: None, _pin: PhantomPinned }\n    }\n}",
    "verification": "Run `cargo test` with Miri using `MIRIFLAGS=\"-Zmiri-tag-raw-pointers\" cargo miri test` to detect undefined behavior related to pointer aliasing and pinning.",
    "date": "2026-05-17",
    "id": 1778983692,
    "type": "error"
});