window.onPostDataLoaded({
    "title": "Resolving Rust Pinning Violations in Async Structures",
    "slug": "rust-pinning-violations-async",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Backend",
        "Systems",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, self-referential structures are inherently dangerous because moving the structure in memory invalidates internal pointers. This is a common issue when building manual Future implementations or complex async state machines.</p><p>The <code>Pin</code> wrapper guarantees that the data it points to will not be moved until it is dropped, ensuring that self-references remain valid. Violations occur when developers attempt to access fields mutably without satisfying the Unpin trait or failing to use <code>project()</code> correctly.</p>",
    "root_cause": "Moving a self-referential struct after pointers to its fields have been created, leading to dangling pointers and undefined behavior.",
    "bad_code": "struct SelfRef {\n    data: String,\n    ptr: *const String,\n}\n\nimpl SelfRef {\n    fn new(txt: &str) -> Self {\n        let mut s = SelfRef { data: txt.to_string(), ptr: std::ptr::null() };\n        s.ptr = &s.data; // Pointer to internal field\n        s\n    }\n} // If this is moved, 'ptr' becomes invalid.",
    "solution_desc": "Use the Pin<P> type along with PhantomPinned to mark the struct as !Unpin. Use the 'pin-project' crate to safely handle field projection.",
    "good_code": "use std::pin::Pin;\nuse std::marker::PhantomPinned;\n\nstruct SelfRef {\n    data: String,\n    ptr: *const String,\n    _pin: PhantomPinned,\n}\n\nimpl SelfRef {\n    fn new(txt: &str) -> Pin<Box<Self>> {\n        let res = SelfRef {\n            data: txt.to_string(),\n            ptr: std::ptr::null(),\n            _pin: PhantomPinned,\n        };\n        let mut boxed = Box::pin(res);\n        let data_ptr = &boxed.data as *const String;\n        unsafe {\n            let mut_ref: Pin<&mut SelfRef> = boxed.as_mut();\n            Pin::get_unchecked_mut(mut_ref).ptr = data_ptr;\n        }\n        boxed\n    }\n}",
    "verification": "Compile with 'cargo check'. Use 'miri' to detect undefined behavior in pointers during runtime execution.",
    "date": "2026-02-18",
    "id": 1771377548,
    "type": "error"
});