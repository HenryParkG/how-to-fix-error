window.onPostDataLoaded({
    "title": "Fixing Wasm Linear Memory Bounds Check Failures",
    "slug": "wasm-linear-memory-bounds-fix",
    "language": "TypeScript",
    "code": "OUT_OF_BOUNDS",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebAssembly",
        "Error Fix"
    ],
    "analysis": "<p>WebAssembly modules use a linear memory model (ArrayBuffer). In high-performance modules that perform frequent memory growth (via memory.grow), the underlying buffer in JavaScript is detached and replaced with a new, larger one. If the host environment (TypeScript/JS) holds a reference to an old TypedArray view, any access will throw a 'TypeMismatch' or 'OutOfBounds' error because the old buffer is now zero-length.</p>",
    "root_cause": "Directly caching TypedArray views (like Uint8Array) of Wasm memory across function calls that may trigger memory allocation/growth.",
    "bad_code": "const wasmMem = new Uint8Array(instance.exports.memory.buffer);\nfunction processData(ptr, len) {\n    // If wasm.grow() was called, wasmMem is now detached!\n    return wasmMem.subarray(ptr, ptr + len);\n}",
    "solution_desc": "Always re-derive the TypedArray view from the Wasm memory buffer at the point of use, or use a getter that checks if the buffer has changed.",
    "good_code": "class WasmBridge {\n    get view() {\n        return new Uint8Array(this.instance.exports.memory.buffer);\n    }\n\n    getData(ptr, len) {\n        // Fresh view ensures we aren't using a detached buffer\n        return this.view.subarray(ptr, ptr + len);\n    }\n}",
    "verification": "Trigger a memory growth event in the Wasm module and verify that subsequent reads from the host do not throw 'ArrayBuffer detached' errors.",
    "date": "2026-04-30",
    "id": 1777546001,
    "type": "error"
});