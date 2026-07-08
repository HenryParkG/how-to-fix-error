window.onPostDataLoaded({
    "title": "Rust Async Pinning: Diagnosing Undefined Behavior",
    "slug": "rust-async-pinning-undefined-behavior",
    "language": "Rust",
    "code": "Lifetime Violation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>When constructing self-referential structures in Rust\u2014where a struct contains a pointer to one of its own fields\u2014async operations can trigger severe undefined behavior. If the structure is moved in memory after a self-referential pointer is created, the pointer becomes dangling, leading to memory corruption during subsequent polls.</p>",
    "root_cause": "Rust's compiler assumes all types can be moved safely by default (implementing the 'Unpin' auto-trait). When a self-referential async future is moved after its internal references are established, pointers to its internal fields are not updated, resulting in dangling references.",
    "bad_code": "struct SelfReferential {\n    value: String,\n    pointer: *const String,\n}\n\nimpl SelfReferential {\n    fn new(val: String) -> Self {\n        let mut s = SelfReferential { value: val, pointer: std::ptr::null() };\n        s.pointer = &s.value as *const String;\n        s\n    }\n}",
    "solution_desc": "Leverage the 'Pin' wrapper along with 'PhantomPinned' to guarantee that the structure cannot be moved in memory once initialized, ensuring pointers remain valid.",
    "good_code": "use std::marker::PhantomPinned;\nuse std::pin::Pin;\n\nstruct SelfReferential {\n    value: String,\n    pointer: *const String,\n    _marker: PhantomPinned,\n}\n\nimpl SelfReferential {\n    fn new(val: String) -> Pin<Box<Self>> {\n        let res = SelfReferential {\n            value: val,\n            pointer: std::ptr::null(),\n            _marker: PhantomPinned,\n        };\n        let mut boxed = Box::pin(res);\n        let self_ptr = &boxed.value as *const String;\n        unsafe {\n            let mut_ref = Pin::as_mut(&mut boxed);\n            let unchecked = Pin::get_unchecked_mut(mut_ref);\n            unchecked.pointer = self_ptr;\n        }\n        boxed\n    }\n}",
    "verification": "Run the test suite under Miri (using 'cargo miri test') to verify that no undefined behavior or invalid pointer dereferences occur during async execution.",
    "date": "2026-07-08",
    "id": 1783498268,
    "type": "error"
});