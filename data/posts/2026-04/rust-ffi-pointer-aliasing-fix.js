window.onPostDataLoaded({
    "title": "Fixing Pointer Aliasing Violations in Rust FFI",
    "slug": "rust-ffi-pointer-aliasing-fix",
    "language": "Rust",
    "code": "UB Violation",
    "tags": [
        "Rust",
        "Backend",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When interfacing Rust with C libraries, developers often mistakenly pass Rust references (&T or &mut T) directly into extern functions. Rust's compiler assumes strict aliasing rules: a &mut T must be unique. However, C code does not respect these guarantees and might retain a pointer to that memory. If the Rust side modifies the data while C holds a pointer, or vice versa, it triggers Undefined Behavior (UB) because the compiler may optimize code based on incorrect assumptions about memory exclusivity.</p>",
    "root_cause": "Using Rust's safe reference types in FFI signatures instead of raw pointers (*const T / *mut T) and failing to use #[repr(C)] for struct layout stability.",
    "bad_code": "pub struct Data { x: i32 }\n\n// BUG: Rust may reorder fields, and &mut is too strict for FFI\nextern \"C\" {\n    fn c_process_data(data: &mut Data);\n}",
    "solution_desc": "Define structs with #[repr(C)] to ensure C-compatible memory layout. Use raw pointers in the FFI function signature to explicitly signal to the Rust compiler that aliasing may occur and that it should not apply standard reference optimizations.",
    "good_code": "#[repr(C)]\npub struct Data { x: i32 }\n\nextern \"C\" {\n    // Use raw pointer to allow C-side persistence\n    fn c_process_data(data: *mut Data);\n}\n\n// Usage\nunsafe {\n    c_process_data(&mut my_data as *mut Data);\n}",
    "verification": "Run 'cargo miri test' to check for memory safety violations. Miri will detect if the C-style access violates Rust's stacked borrows rules.",
    "date": "2026-04-11",
    "id": 1775899947,
    "type": "error"
});