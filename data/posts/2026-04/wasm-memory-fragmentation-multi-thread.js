window.onPostDataLoaded({
    "title": "Fixing Wasm Linear Memory Fragmentation in Workers",
    "slug": "wasm-memory-fragmentation-multi-thread",
    "language": "Rust",
    "code": "WasmRuntimeError",
    "tags": [
        "Rust",
        "Frontend",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>WebAssembly (Wasm) uses a linear memory model. In multi-threaded environments (using SharedArrayBuffer and pthreads), memory is shared across workers. Because the Wasm heap can only grow and never shrink, inefficient allocation patterns (high churn of small objects) lead to external fragmentation. Over time, the allocator (e.g., dlmalloc) may fail to find a contiguous block of memory for a large allocation, even if the total free memory is sufficient, resulting in an 'out of memory' error despite having megabytes of perceived 'free' space.</p>",
    "root_cause": "Frequent small allocations in multi-threaded Wasm workers cause the heap to become a 'Swiss cheese' of small free blocks that cannot be coalesced, leading to allocation failure when a larger contiguous block is requested.",
    "bad_code": "// High churn allocation in a loop without reuse\nfor (let i = 0; i < 10000; i++) {\n  let data = new Uint8Array(worker.memory.buffer, offset, size);\n  // Process and lose reference, but Wasm heap stays fragmented\n}",
    "solution_desc": "Switch to a fragmentation-resistant allocator like `wee_alloc` (for small size) or `mimalloc` (for performance). Implement object pooling in the Wasm module to reuse memory blocks of fixed sizes, and use `memory.grow` sparingly. In Rust, utilizing a global allocator that handles thread-local caches can significantly reduce contention and fragmentation.",
    "good_code": "// Use jemalloc or mimalloc in Rust for better heap management\n#[global_allocator]\nstatic ALLOC: mimalloc::MiMalloc = mimalloc::MiMalloc;\n\n// Pre-allocate a large buffer and manage it manually via a Pool\nlet mut pool = ObjectPool::with_capacity(1024);\nlet buf = pool.checkout().unwrap();",
    "verification": "Use browser DevTools (Memory tab) or `wasm-bindgen` memory statistics to track the delta between 'allocated memory' and 'used memory' over time.",
    "date": "2026-04-09",
    "id": 1775718824,
    "type": "error"
});