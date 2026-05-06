window.onPostDataLoaded({
    "title": "Rust Async Stream FFI Cancellation Safety",
    "slug": "rust-async-ffi-stream-cancellation-safety",
    "language": "Rust",
    "code": "AsyncCancellationError",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When wrapping asynchronous streams in Rust for use over FFI (Foreign Function Interface), a critical risk emerges regarding cancellation safety. Rust's <code>Future</code> and <code>Stream</code> traits allow a future to be dropped at any <code>await</code> point. If the FFI layer has initiated an asynchronous operation in a C/C++ library\u2014passing a raw pointer to Rust-managed memory\u2014dropping the Rust future doesn't automatically stop the C-side callback. This leads to use-after-free or double-free vulnerabilities when the C library eventually tries to execute the callback on a pointer that Rust has already deallocated.</p>",
    "root_cause": "The Rust Future is dropped during a task cancellation, but the external C library still holds a raw pointer to a pinned buffer or a completion handle, leading to an invalid memory access when the C event loop fires.",
    "bad_code": "pub async fn fetch_ffi_stream(handle: *mut Context) {\n    let buffer = [0u8; 1024];\n    // UNSAFE: If this future is dropped, the C library still has the pointer to 'buffer'\n    ffi_start_async_read(handle, buffer.as_mut_ptr());\n    PendingStream.await\n}",
    "solution_desc": "Implement a custom Drop guard or use an Atomic State machine to track the lifecycle of the FFI call. Ensure that the C-side operation is explicitly cancelled or that the Rust-side memory is held in an 'Arc' or 'ManuallyDrop' until the C callback definitively returns, even if the stream itself is dropped.",
    "good_code": "struct FfiGuard { handle: *mut Context, active: Arc<AtomicBool> }\nimpl Drop for FfiGuard {\n    fn drop(&mut self) {\n        unsafe { ffi_cancel_operation(self.handle); }\n        self.active.store(false, Ordering::SeqCst);\n    }\n}\n\n// Use a shared state that survives the Future's drop\nlet shared_buf = Arc::new(Mutex::new(vec![0u8; 1024]));",
    "verification": "Run tests using Miri with 'cargo miri test' to detect undefined behavior in FFI calls and simulate early task cancellation using 'tokio::select!'.",
    "date": "2026-05-06",
    "id": 1778054922,
    "type": "error"
});