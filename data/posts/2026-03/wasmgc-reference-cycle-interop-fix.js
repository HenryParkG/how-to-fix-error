window.onPostDataLoaded({
    "title": "Eliminating WasmGC Reference Cycles in JS Interop",
    "slug": "wasmgc-reference-cycle-interop-fix",
    "language": "Rust / Wasm",
    "code": "Memory Leak (Cycle)",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebAssembly",
        "Error Fix"
    ],
    "analysis": "<p>WasmGC introduces a garbage-collected heap within WebAssembly, but interop with JavaScript still relies on opaque handles. A reference cycle occurs when a WasmGC object holds a reference to a JS object (via an externref), and that JS object in turn holds a reference back to the same WasmGC object. Since the JS Garbage Collector and the Wasm Garbage Collector often operate independently or lack a unified cycle-collection graph, these objects are never freed.</p>",
    "root_cause": "Cross-heap references where a WasmGC struct points to an Externref (JS) that contains a handle to the original Wasm struct.",
    "bad_code": "// JS Side\nconst wasmObj = wasm.create_struct();\nconst jsObj = { ref: wasmObj };\nwasm.set_js_ref(wasmObj, jsObj); // Cycle created",
    "solution_desc": "Use the 'FinalizationRegistry' in JavaScript to manually break the cycle or utilize 'WeakRef' for the back-reference from JS to Wasm. Architecturally, avoid storing JS-side handles inside WasmGC structs whenever possible; instead, use a registry with integer IDs that can be cleared.",
    "good_code": "// JS Side using WeakRef\nconst wasmObj = wasm.create_struct();\nconst jsObj = { ref: new WeakRef(wasmObj) };\nwasm.set_js_ref(wasmObj, jsObj);\n\n// To access: jsObj.ref.deref()",
    "verification": "Monitor the heap size using Chrome DevTools Memory tab after repeated allocations and forced GC triggers.",
    "date": "2026-03-14",
    "id": 1773450781,
    "type": "error"
});