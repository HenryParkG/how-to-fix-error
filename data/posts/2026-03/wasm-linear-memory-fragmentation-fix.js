window.onPostDataLoaded({
    "title": "Fixing WebAssembly Linear Memory Fragmentation",
    "slug": "wasm-linear-memory-fragmentation-fix",
    "language": "Rust",
    "code": "MemoryFragmentation",
    "tags": [
        "Rust",
        "Backend",
        "WebAssembly",
        "Error Fix"
    ],
    "analysis": "<p>In long-running WebAssembly (Wasm) runtimes, linear memory fragmentation occurs when the guest allocator (inside the Wasm module) and the host environment fail to coordinate on memory reuse. Because Wasm memory can only grow via <code>memory.grow</code> and never shrink in standard specifications, non-contiguous free blocks accumulate. This leads to <code>Out of Memory</code> errors even when the total free memory is theoretically sufficient for the next allocation.</p>",
    "root_cause": "Standard C/Rust allocators like dlmalloc or wee_alloc do not perform compaction within Wasm's linear memory space, leading to holes that cannot be reclaimed by the host OS.",
    "bad_code": "let mut data = Vec::with_capacity(1024 * 1024);\n// Repeatedly allocating and dropping large buffers in a loop\nfor _ in 0..10000 {\n    let _tmp = vec![0u8; 512];\n    // The heap grows but never effectively compacts\n}",
    "solution_desc": "Switch to a more sophisticated allocator like 'talc' or implement a pool-based allocation strategy for fixed-size objects to ensure high reuse of existing memory blocks without triggering linear growth.",
    "good_code": "use talc::*;\nstatic mut ARENA: [u8; 10000] = [0; 10000];\n#[global_allocator]\nstatic ALLOCATOR: Talck<spin::Mutex<()>, ClaimOnOom> = Talc::new(unsafe {\n    // Initialize with a claimer to handle OOM locally before requesting host growth\n    ClaimOnOom::new(Span::from_array(&ARENA))\n}).lock();",
    "verification": "Monitor the 'wasm_memory_external_fragmentation_ratio' metric and verify it stays below 0.15 during 24-hour stress tests.",
    "date": "2026-03-08",
    "id": 1772961660,
    "type": "error"
});