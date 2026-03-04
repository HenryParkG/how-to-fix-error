window.onPostDataLoaded({
    "title": "Fixing Wasm Linear Memory Fragmentation",
    "slug": "wasm-memory-fragmentation-fix",
    "language": "TypeScript",
    "code": "Wasm-Mem-Leak",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebAssembly",
        "Error Fix"
    ],
    "analysis": "<p>WebAssembly uses a linear memory model\u2014a single contiguous buffer of bytes. Unlike high-level languages with moving garbage collectors, Wasm allocators (like dlmalloc) manage this block manually. In long-running browser sessions (e.g., video editors or complex web apps), frequent allocation and deallocation of varied sizes lead to 'external fragmentation'.</p><p>This results in a scenario where the total free memory is sufficient for a new allocation, but no single contiguous block is large enough. The runtime then calls `memory.grow`, which can eventually hit browser limits or OOM (Out of Memory) despite plenty of 'logical' free space.</p>",
    "root_cause": "The lack of a compacting garbage collector in Wasm linear memory causes small 'holes' that cannot be reclaimed or merged efficiently by standard allocators.",
    "bad_code": "// Repeatedly allocating/freeing large buffers in a long-lived loop\nfor (let i = 0; i < 100000; i++) {\n  let ptr = wasmModule.alloc(Math.random() * 1024);\n  // processing...\n  wasmModule.free(ptr);\n}",
    "solution_desc": "Implement an object pooling strategy for frequently used buffer sizes to reuse memory blocks. Alternatively, use a modern allocator like 'tlsf' (Two-Level Segregated Fit) which is designed for real-time constraints and minimizes fragmentation compared to dlmalloc.",
    "good_code": "// Use a Pool for common allocation sizes\nconst pool = new Map();\n\nfunction getBuffer(size) {\n  if (pool.has(size) && pool.get(size).length > 0) {\n    return pool.get(size).pop();\n  }\n  return wasmModule.malloc(size);\n}\n\nfunction releaseBuffer(ptr, size) {\n  if (!pool.has(size)) pool.set(size, []);\n  pool.get(size).push(ptr);\n}",
    "verification": "Monitor 'performance.memory.usedJSHeapSize' and use browser profiling tools to track the 'Total Reserved Memory' of the Wasm instance over time.",
    "date": "2026-03-04",
    "id": 1772586812,
    "type": "error"
});