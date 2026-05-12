window.onPostDataLoaded({
    "title": "Resolving Memory Fragmentation in Multi-Tenant Wasm",
    "slug": "wasm-memory-fragmentation-multi-tenant",
    "language": "Rust",
    "code": "MemoryOOM",
    "tags": [
        "Rust",
        "Wasm",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>WebAssembly runtimes like Wasmtime or Wasmer allocate linear memory in 64KiB pages. In multi-tenant environments, standard allocators often fail to return unused pages to the host OS. Over time, the host process suffers from RSS (Resident Set Size) bloat even if the Wasm instances have freed their internal objects, leading to OOM kills.</p>",
    "root_cause": "The default 'dlmalloc' or 'wee_alloc' within Wasm guests does not always issue 'memory.grow' in reverse or hint to the host that memory is reclaimable.",
    "bad_code": "// Inside Rust Wasm guest\n#[global_allocator]\nstatic ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;\n\nfn process() {\n    let mut data = Vec::with_capacity(1000000);\n    // data is dropped, but memory isn't returned to Host OS\n}",
    "solution_desc": "Use a pooling allocator in the Wasm host configuration and implement a custom allocator in the guest that leverages 'MADV_DONTNEED' (via host calls) or use 'memory-protection' tricks to decommit pages.",
    "good_code": "// Host side (Wasmtime Example)\nlet mut config = Config::new();\nconfig.allocation_strategy(InstanceAllocationStrategy::Pooling(PoolingAllocationConfig::default()));\nlet engine = Engine::new(&config)?;",
    "verification": "Check process RSS using 'ps -o rss' or 'top' before and after running multiple Wasm tenants; RSS should now scale with active usage rather than peak usage.",
    "date": "2026-05-12",
    "id": 1778565479,
    "type": "error"
});