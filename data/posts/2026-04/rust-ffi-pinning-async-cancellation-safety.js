window.onPostDataLoaded({
    "title": "Rust: Fixing FFI Pinning & Async Cancellation Safety",
    "slug": "rust-ffi-pinning-async-cancellation-safety",
    "language": "Rust",
    "code": "Soundness Violation",
    "tags": [
        "Rust",
        "Backend",
        "FFI",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>When bridging Rust async code with C libraries, a common soundness hole occurs during cancellation. If a future is dropped while an FFI call is still referencing memory owned by that future, the C library may write to deallocated or repurposed memory. Even with <code>Pin</code>, Rust doesn't natively prevent the memory from being reused after the future's destructor runs, unless specifically handled.</p>",
    "root_cause": "Rust's Pin guarantees that an object won't move, but it does not guarantee 'completion' before destruction. In async contexts, dropping a future immediately stops its execution, potentially leaving an FFI callback with a dangling pointer to a local buffer that is now invalid.",
    "bad_code": "async fn read_into_ffi(ptr: *mut u8) {\n    let mut buffer = [0u8; 1024];\n    // If this future is dropped during await, \n    // the FFI might still write to 'buffer' which is now off-stack.\n    ffi_lib_start_read(buffer.as_mut_ptr()).await;\n}",
    "solution_desc": "Use a 'Completion-based' abstraction. Move the buffer into an Arc or a heap-allocated structure that stays alive until the FFI layer explicitly signals it is finished, or use a guard that blocks/cancels the FFI operation in its Drop implementation.",
    "good_code": "struct FfiGuard { ptr: *mut u8, active: bool }\nimpl Drop for FfiGuard {\n    fn drop(&mut self) { if self.active { unsafe { ffi_lib_cancel(self.ptr); } } }\n}\n\nasync fn safe_read() {\n    let mut buffer = Box::pin(vec![0u8; 1024]);\n    let guard = FfiGuard { ptr: buffer.as_mut_ptr(), active: true };\n    ffi_wrapper_read(buffer.as_mut_ptr()).await;\n    // Guard ensures cancellation if dropped early\n}",
    "verification": "Run tests using Miri with 'MIRIFLAGS=-Zmiri-check-number-validity' and simulate heavy task cancellation using 'tokio::select!'.",
    "date": "2026-04-26",
    "id": 1777187942,
    "type": "error"
});