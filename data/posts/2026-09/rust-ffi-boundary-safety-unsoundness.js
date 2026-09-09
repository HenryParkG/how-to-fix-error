window.onPostDataLoaded({
    "title": "Fixing Rust FFI Unsoundness & Pointer Aliasing",
    "slug": "rust-ffi-boundary-safety-unsoundness",
    "language": "Rust",
    "code": "UndefinedBehavior",
    "tags": [
        "Rust",
        "FFI",
        "MemorySafety",
        "Error Fix"
    ],
    "analysis": "<p>When bridging Rust with C or C++ via Foreign Function Interfaces (FFI), developers frequently fall into the trap of passing Rust references (<code>&amp;T</code> or <code>&amp;mut T</code>) directly across the language boundary. In Rust, a reference carries strict semantic invariants enforced by the compiler: <code>&amp;mut T</code> must guarantee exclusive aliasing for its entire lifetime. If foreign code stores this reference, passes it to another thread, or creates simultaneous mutable pointers to the same memory location, Rust's stacked/tree borrows model is violated immediately.</p><p>This leads to subtle Undefined Behavior (UB). LLVM applies aggressive optimizations\u2014such as instruction reordering, dead store elimination, and caching values in registers\u2014assuming no other pointer can modify the referenced memory. When foreign code breaks this assumption, state corruption occurs without a panic or crash at the exact point of the call.</p>",
    "root_cause": "Passing Rust references across FFI boundaries instead of raw pointers, causing violations of Rust's aliasing rules and pointer provenance invariants when foreign code mutates or retains aliases.",
    "bad_code": "#[repr(C)]\npub struct Buffer {\n    data: *mut u8,\n    len: usize,\n}\n\n// Flawed: Exposing &mut directly across FFI boundary\n#[no_mangle]\npub extern \"C\" fn process_buffer(buf: &mut Buffer) {\n    unsafe {\n        // C library might retain a copy of buf or write concurrently\n        c_external_mutate(buf as *mut Buffer);\n    }\n    // LLVM assumes 'buf' has not been aliased or asynchronously modified here\n    if buf.len > 0 {\n        println!(\"Processed: {}\", buf.len);\n    }\n}\n\nextern \"C\" {\n    fn c_external_mutate(ptr: *mut Buffer);\n}",
    "solution_desc": "Replace references with raw pointers (`*mut T` or `*const T`) or opaque pointers at the FFI boundary. Use `std::ptr::NonNull` for non-null pointer guarantees and convert to references only within well-bounded, localized unsafe scopes where exclusive access can be mathematically or logically guaranteed.",
    "good_code": "use std::ptr::NonNull;\n\n#[repr(C)]\npub struct Buffer {\n    data: *mut u8,\n    len: usize,\n}\n\n#[no_mangle]\npub extern \"C\" fn process_buffer(buf_ptr: *mut Buffer) -> i32 {\n    // Check for null pointer explicitly at ABI boundary\n    let non_null_buf = match NonNull::new(buf_ptr) {\n        Some(p) => p,\n        None => return -1, // Return error code to C caller\n    };\n\n    unsafe {\n        // Keep as raw pointer across foreign calls to prevent alias assertions\n        c_external_mutate(non_null_buf.as_ptr());\n        \n        // Read fields via raw pointer dereference without creating references\n        let current_len = std::ptr::addr_of!((*non_null_buf.as_ptr()).len).read();\n        if current_len > 0 {\n            // Safe scope\n        }\n    }\n    0\n}\n\nextern \"C\" {\n    fn c_external_mutate(ptr: *mut Buffer);\n}",
    "verification": "Run test suites under Miri using `cargo miri test` with `-Zmiri-tree-borrows` or `-Zmiri-tag-raw-pointers` enabled. Miri detects pointer provenance violations, invalid reborrows, and foreign-held aliasing at runtime.",
    "date": "2026-09-09",
    "id": 1788939766,
    "type": "error"
});