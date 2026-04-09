window.onPostDataLoaded({
    "title": "Fixing WebGPU Memory Sync Hazards in Compute Pipelines",
    "slug": "webgpu-memory-sync-hazards-compute-pipelines",
    "language": "WGSL",
    "code": "DataRace",
    "tags": [
        "WebGPU",
        "Graphics",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>In multi-pass WebGPU compute pipelines, a 'Synchronization Hazard' occurs when a subsequent compute pass attempts to read from a storage buffer before the previous write operation has finished committing to memory. Since GPUs are highly parallel, execution order does not guarantee data visibility across different dispatch calls unless explicit barriers or proper pass sequencing are implemented. This results in flickering artifacts or corrupted simulation data.</p>",
    "root_cause": "Missing storage barriers in WGSL or failing to separate conflicting read/write operations into distinct compute passes within the command encoder.",
    "bad_code": "// Inside WGSL\nfn main() {\n  data[id] = data[id] * 2.0;\n  // Hazard: Next line might read old data[id-1]\n  let neighboring_val = data[id-1];\n}",
    "solution_desc": "Use the `storageBarrier()` function in WGSL to synchronize workgroups, or ensure the GPUCommandEncoder utilizes different passes for Read-After-Write (RAW) dependencies to force a global memory sync.",
    "good_code": "// Inside WGSL with barrier\nfn main() {\n  data[id] = data[id] * 2.0;\n  storageBarrier(); \n  let neighboring_val = data[id-1]; \n}\n\n// In TypeScript: Use separate passes\nconst encoder = device.createCommandEncoder();\nconst pass1 = encoder.beginComputePass();\n// ... dispatch 1\npass1.end();\nconst pass2 = encoder.beginComputePass();\n// ... dispatch 2",
    "verification": "Enable WebGPU validation layers; they will flag 'Missing Barrier' warnings. Verify consistency by checking if output buffers match expected deterministic results across frames.",
    "date": "2026-04-09",
    "id": 1775697529,
    "type": "error"
});