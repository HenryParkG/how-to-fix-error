window.onPostDataLoaded({
    "title": "Debugging Wasm Linear Memory Bounds Violations",
    "slug": "wasm-memory-bounds-violations-multi-threaded",
    "language": "Rust",
    "code": "MemoryOutOfBounds",
    "tags": [
        "Rust",
        "WebAssembly",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In multi-threaded WebAssembly environments (using the threads proposal), shared linear memory can lead to non-deterministic Out-of-Bounds (OOB) errors. This typically occurs when one thread performs a <code>memory.grow</code> operation while another thread is executing an operation that relies on the previously cached memory bound. Because Wasm memory growth is an atomic operation but the underlying host-mapped memory address might change, the runtime may fail to synchronize the new limit across all thread-local execution contexts immediately.</p>",
    "root_cause": "Race condition between memory expansion and pointer dereferencing across multiple WebAssembly threads using shared buffers.",
    "bad_code": "// Potentially dangerous raw pointer access in shared memory context\nfn write_to_buffer(ptr: *mut u8, len: usize) {\n    unsafe {\n        // If another thread grows memory, this ptr might become invalid \n        // or the index might exceed the old memory limit.\n        std::ptr::write_bytes(ptr, 0, len);\n    }\n}",
    "solution_desc": "Instead of caching pointers or manual length checks, use the 'memory.size' instruction dynamically and ensure the runtime is configured with a 'Maximum Memory' limit to prevent address space fragmentation. In Rust, utilize the 'Wasm-bindgen' atomics features or 'shared-memory' crates that handle synchronization of memory views.",
    "good_code": "// Safer approach using bounds checking relative to current memory size\nfn safe_write(offset: usize, data: &[u8]) {\n    let current_pages = core::arch::wasm32::memory_size(0);\n    let current_bytes = current_pages * 65536;\n    if offset + data.len() <= current_bytes {\n        unsafe {\n            let ptr = (offset as *mut u8);\n            std::ptr::copy_nonoverlapping(data.as_ptr(), ptr, data.len());\n        }\n    }\n}",
    "verification": "Run the module in Wasmtime with '--enable-threads' and use a memory stress test that calls memory.grow frequently during concurrent writes.",
    "date": "2026-03-01",
    "id": 1772328182,
    "type": "error"
});