window.onPostDataLoaded({
    "title": "Fixing Send/Sync Violations in Rust FFI Wrappers",
    "slug": "rust-ffi-send-sync-fix",
    "language": "Rust",
    "code": "E0277_ThreadSafety",
    "tags": [
        "Rust",
        "FFI",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>When wrapping C libraries in Rust, you often deal with raw pointers (`*mut T` or `*const T`). By default, Rust marks raw pointers as !Send and !Sync because it cannot guarantee that the underlying C memory is safe to transfer across threads or access concurrently. If you attempt to pass a struct containing these pointers into a `thread::spawn` or a Rayon parallel iterator, the compiler will trigger a violation, preventing the code from compiling even if the C library is thread-safe.</p>",
    "root_cause": "Raw pointers are automatically opted-out of Send and Sync traits by the Rust compiler to prevent accidental data races in unmanaged memory.",
    "bad_code": "struct LibWrapper {\n    handle: *mut libc::c_void,\n}\n\n// Error: LibWrapper cannot be sent between threads safely\nfn parallel_task(w: LibWrapper) {\n    std::thread::spawn(move || {\n        let _ = w.handle;\n    });\n}",
    "solution_desc": "Manually implement Send and Sync for the wrapper struct after verifying the underlying C library's thread-safety guarantees. Use 'unsafe impl' to tell the compiler that you take responsibility for the pointer's behavior across threads.",
    "good_code": "struct LibWrapper {\n    handle: *mut libc::c_void,\n}\n\n// Safety: The underlying C library is documented as thread-safe\nunsafe impl Send for LibWrapper {}\nunsafe impl Sync for LibWrapper {}\n\nfn parallel_task(w: LibWrapper) {\n    std::thread::spawn(move || {\n        let _ = w.handle;\n    });\n}",
    "verification": "Run 'cargo check' to ensure the E0277 error is resolved and use 'ThreadSanitizer' to verify no data races occur at runtime.",
    "date": "2026-03-16",
    "id": 1773644785,
    "type": "error"
});