window.onPostDataLoaded({
    "title": "Debugging OCaml-to-Wasm GC Memory Leaks",
    "slug": "ocaml-wasm-gc-leak-debug",
    "language": "TypeScript",
    "code": "Memory Leak",
    "tags": [
        "TypeScript",
        "Next.js",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When compiling OCaml to WebAssembly using the Wasm GC extension, memory leaks often occur at the boundary between the JS Host and the Wasm Module. If Wasm objects are wrapped in JS closures or stored in global JS arrays without proper cleanup, the Wasm GC cannot reclaim them because the JS engine maintains a 'root' reference to the Wasm-managed heap.</p>",
    "root_cause": "Circular references between JS objects and Wasm GC-managed structs. The JS Garbage Collector and the Wasm GC act independently, leading to 'orphan' objects that are unreachable but not freed.",
    "bad_code": "// JS Host Interop\nlet registry = [];\nexport function registerWasmObject(obj) {\n    // Leak: JS array holds reference to Wasm GC object indefinitely\n    registry.push(obj);\n}",
    "solution_desc": "Use 'FinalizationRegistry' in the JS host to track the lifecycle of Wasm objects and ensure that references are cleared when the JS proxy object is collected.",
    "good_code": "const registry = new FinalizationRegistry((heldValue) => {\n    console.log('Wasm object collected');\n});\n\nexport function registerWasmObject(obj) {\n    const ref = new WeakRef(obj);\n    // No strong reference held in registry\n    registry.register(obj, \"metadata\"); \n}",
    "verification": "Use Chrome DevTools Memory tab to take heap snapshots. Filter by 'Wasm' objects and check for increasing counts after repetitive operations.",
    "date": "2026-03-27",
    "id": 1774587729,
    "type": "error"
});