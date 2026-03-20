window.onPostDataLoaded({
    "title": "Solving Rust Pinning Violations in Async Structs",
    "slug": "rust-pinning-violations-async-self-referential",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, self-referential structs are notoriously difficult because moving the struct in memory invalidates internal pointers. This is a common issue when creating complex async Futures or manually implementing state machines. The Pin type guarantees that the data at a specific memory location will not be moved, ensuring pointer validity.</p><p>When a struct holds a reference to its own data and that struct is moved (e.g., returned from a function or pushed into a Vec), the reference becomes a dangling pointer to the old memory location, leading to undefined behavior or segmentation faults.</p>",
    "root_cause": "The default behavior of Rust types is that they are 'Unpin', meaning they can be moved freely. Self-referential structs violate memory safety during a move because the internal pointer remains pointing to the old stack/heap address.",
    "bad_code": "struct SelfRef {\n    data: String,\n    ptr: *const String,\n}\n\nimpl SelfRef {\n    fn new(txt: &str) -> Self {\n        let mut s = SelfRef { data: txt.to_string(), ptr: std::ptr::null() };\n        s.ptr = &s.data; // Pointer to internal field\n        s\n    }\n} // If this is moved, 'ptr' becomes invalid.",
    "solution_desc": "To fix this, we wrap the struct in a Pin<Box<T>>. This pins the data to the heap, ensuring that even if the 'Pin' wrapper is moved, the underlying data stays at the same memory address. We also use PhantomPinned to mark the type as !Unpin.",
    "good_code": "use std::marker::PhantomPinned;\nuse std::pin::Pin;\n\nstruct SelfRef {\n    data: String,\n    ptr: *const String,\n    _pin: PhantomPinned,\n}\n\nfn create_pinned(txt: &str) -> Pin<Box<SelfRef>> {\n    let res = SelfRef {\n        data: txt.to_string(),\n        ptr: std::ptr::null(),\n        _pin: PhantomPinned,\n    };\n    let mut boxed = Box::pin(res);\n    let data_ptr = &boxed.data as *const String;\n    unsafe { boxed.as_mut().get_unchecked_mut().ptr = data_ptr };\n    boxed\n}",
    "verification": "Run 'cargo test' and use the 'Miri' tool (cargo miri run) to detect experimental undefined behavior or pointer invalidations.",
    "date": "2026-03-20",
    "id": 1773999153,
    "type": "error"
});