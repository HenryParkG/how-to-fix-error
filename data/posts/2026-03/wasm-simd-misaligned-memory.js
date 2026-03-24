window.onPostDataLoaded({
    "title": "Fixing Misaligned Memory Access Traps in WASM SIMD",
    "slug": "wasm-simd-misaligned-memory",
    "language": "WebAssembly",
    "code": "Runtime Trap",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebAssembly SIMD instructions like <code>v128.load</code> are highly sensitive to memory alignment. While the WebAssembly specification allows unaligned loads (though they may be slower), many compilers and runtimes default to strict 16-byte alignment requirements for 128-bit vectors. Passing an unaligned pointer from the JavaScript host to a SIMD-accelerated WASM function often triggers a runtime trap.</p>",
    "root_cause": "Attempting to load a 128-bit (16-byte) SIMD vector from a memory address that is not a multiple of 16.",
    "bad_code": "const buffer = new Uint8Array(wasmMemory.buffer, offset, length);\n// offset is 4, which is not 16-byte aligned\nwasmExports.simd_process(offset);",
    "solution_desc": "Ensure that buffers allocated for SIMD operations are aligned to a 16-byte boundary. In C/C++, use __attribute__((aligned(16))). In JS, ensure the offset into the WASM linear memory is a multiple of 16.",
    "good_code": "const ALIGNMENT = 16;\nconst rawOffset = wasmMemory.allocate(dataSize);\nconst alignedOffset = (rawOffset + (ALIGNMENT - 1)) & ~(ALIGNMENT - 1);\nwasmExports.simd_process(alignedOffset);",
    "verification": "Use Chrome DevTools to inspect the WASM execution and verify the instruction pointer at the time of the 'RuntimeError: memory access out of bounds' or 'misaligned access' trap.",
    "date": "2026-03-24",
    "id": 1774335238,
    "type": "error"
});