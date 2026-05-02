window.onPostDataLoaded({
    "title": "Fixing Wasm Linear Memory Fragmentation in Workers",
    "slug": "wasm-memory-fragmentation-fix",
    "language": "TypeScript",
    "code": "WASM_OUT_OF_MEMORY",
    "tags": [
        "TypeScript",
        "Rust",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>WebAssembly modules use a linear memory model that can grow but rarely shrinks efficiently. In long-running worker modules (e.g., edge compute), frequent small allocations lead to external fragmentation where free blocks are scattered throughout the address space.</p><p>Eventually, a large allocation request fails because there is no contiguous block available, even if the total free memory is sufficient, triggering an OOM error.</p>",
    "root_cause": "Standard allocators like dlmalloc cannot return intermediate pages to the host OS. Once a memory page is touched, it stays mapped in the Wasm instance until the instance is destroyed.",
    "bad_code": "// Long-lived worker state\nlet workerInstance = await WebAssembly.instantiate(bytes, importObject);\n// Loop running for days\nwhile (true) {\n    const result = workerInstance.exports.process_data(input);\n    // Linear memory continues to grow and fragment\n}",
    "solution_desc": "Implement a 'Generation Recycling' pattern. Use a pool of Wasm instances with a maximum 'request-to-live' (RTL). After a fixed number of operations, drain the instance and replace it with a fresh one to reset the linear memory state.",
    "good_code": "class WasmPool {\n    async getFreshInstance() {\n        if (this.currentUsage > MAX_REQUESTS) {\n            this.instance.exports.cleanup();\n            this.instance = await this.createNewInstance();\n            this.currentUsage = 0;\n        }\n        this.currentUsage++;\n        return this.instance;\n    }\n}",
    "verification": "Use 'performance.measureUserAgentSpecificMemory()' in the host or monitor the 'rss' memory of the process. The memory sawtooth pattern indicates successful recycling.",
    "date": "2026-05-02",
    "id": 1777699771,
    "type": "error"
});