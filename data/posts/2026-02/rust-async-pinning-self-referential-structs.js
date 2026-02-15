window.onPostDataLoaded({
    "title": "Solving Rust Async Memory Violations with Pinning",
    "slug": "rust-async-pinning-self-referential-structs",
    "language": "Rust",
    "code": "ASYNC_PIN_VIOLATION",
    "tags": [
        "Rust",
        "Async",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Rust's async/await generates state machines that often contain self-referential pointers. If an async Future is moved in memory after it has been initialized, these internal pointers become dangling, leading to undefined behavior or memory safety violations.</p><p>The <code>Pin</code> wrapper guarantees that the data it points to will not be moved until it is dropped. This is critical for any structure that stores a reference to its own fields, a common pattern in compiled async blocks where local variables are captured across yield points.</p>",
    "root_cause": "Attempting to poll a Future that contains internal references after it has been moved across a thread boundary or re-allocated without a Pin wrapper.",
    "bad_code": "struct MyFuture {\n    data: String,\n    ptr: *const String,\n}\n\n// Moving this struct would invalidate 'ptr'\nfn create_future() -> MyFuture {\n    let mut f = MyFuture { data: \"test\".into(), ptr: std::ptr::null() };\n    f.ptr = &f.data;\n    f\n}",
    "solution_desc": "Use the `Pin` type to wrap the data, typically on the heap using `Box::pin`. This ensures the memory address remains constant even if the pointer to the box itself is moved.",
    "good_code": "use std::pin::Pin;\nuse std::marker::PhantomPinned;\n\nstruct MyFuture {\n    data: String,\n    ptr: *const String,\n    _pin: PhantomPinned,\n}\n\nfn create_pinned_future() -> Pin<Box<MyFuture>> {\n    let res = MyFuture {\n        data: \"test\".into(),\n        ptr: std::ptr::null(),\n        _pin: PhantomPinned,\n    };\n    let mut boxed = Box::pin(res);\n    let slice = &boxed.data as *const String;\n    // Safety: data is pinned in the box\n    unsafe { boxed.as_mut().get_unchecked_mut().ptr = slice; }\n    boxed\n}",
    "verification": "Run the code through 'Miri' using `cargo miri run`. Miri will detect undefined behavior related to pointer invalidation and move violations.",
    "date": "2026-02-15",
    "id": 1771118456,
    "type": "error"
});