window.onPostDataLoaded({
    "title": "Fixing Ghost-Pointer Aliasing in Rust Unsafe Async Wrappers",
    "slug": "fixing-ghost-pointer-aliasing-rust-unsafe-async",
    "language": "Rust",
    "code": "PointerAliasing",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>When wrapping C libraries or implementing custom intrusive data structures in Rust's async context, developers often use raw pointers to bypass the borrow checker. Ghost-pointer aliasing occurs when the compiler's LLVM backend assumes that two pointers cannot point to the same memory location based on 'noalias' rules, even though the async state machine might move or re-alias them during a poll yield.</p><p>This leads to undefined behavior where writes through one pointer are not visible when reading through another, or memory is invalidated because the Future was moved despite expecting a stable address.</p>",
    "root_cause": "The failure stems from violating the 'Pin' contract while using 'UnsafeCell' or raw pointers. Specifically, LLVM optimizations assume '&mut T' is unique. In an async executor, if memory is reallocated or pointers are cached across await points without proper pinning, the compiler may optimize away necessary memory synchronization.",
    "bad_code": "struct AsyncState {\n    data: UnsafeCell<[u8; 1024]>,\n    ptr: *mut u8,\n}\n\nimpl Future for AsyncState {\n    fn poll(self: Pin<&mut Self>, cx: &mut Context) -> Poll<()> {\n        // BAD: ptr might point to an old location if Self moved\n        unsafe { *self.ptr = 10; }\n        Poll::Ready(())\n    }\n}",
    "solution_desc": "To fix this, implement a structural pinning pattern using the 'Pin' type and ensure that all raw pointers are derived from the pinned address. Use 'PhantomPinned' to prevent the struct from being moved and derive pointers only after pinning is guaranteed.",
    "good_code": "struct AsyncState {\n    data: [u8; 1024],\n    _pin: PhantomPinned,\n}\n\nimpl AsyncState {\n    fn get_data_ptr(self: Pin<&mut Self>) -> *mut u8 {\n        unsafe { self.get_unchecked_mut().data.as_mut_ptr() }\n    }\n}\n\n// Usage ensures address stability across await points",
    "verification": "Run the code with 'MIRIFLAGS=\"-Zmiri-tag-raw-pointers\" cargo miri test' to detect aliasing violations and pointer provenance errors.",
    "date": "2026-03-02",
    "id": 1772426655,
    "type": "error"
});