window.onPostDataLoaded({
    "title": "Fixing WebGPU Compute Shader Memory Barrier Races",
    "slug": "webgpu-compute-shader-memory-barrier-race-condition",
    "language": "TypeScript",
    "code": "RaceCondition",
    "tags": [
        "WebGPU",
        "TypeScript",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>In browser-based LLM inference engine architectures using WebGPU, compute shader memory race conditions occur when subsequent GEMM or attention layer passes read from storage buffers before prior write passes finalize execution. Without explicit workgroup barriers or pass dependency sync, compute pipelines return nondeterministic floating-point NaN or garbled token outputs.</p>",
    "root_cause": "Missing workgroupBarrier() or storageBarrier() inside WGSL shaders, or omitting proper pipeline execution synchronization between dispatch calls across dependent matrix ops.",
    "bad_code": "@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) global_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {\n  // Write shared matrix tile\n  tileData[local_id.x] = inputBuffer[global_id.x];\n  // BUG: Missing workgroupBarrier() before reading shared tileData\n  let accumulated = tileData[63 - local_id.x] * 2.0;\n  outputBuffer[global_id.x] = accumulated;\n}",
    "solution_desc": "Insert explicit WGSL memory and execution barriers (`workgroupBarrier()` or `storageBarrier()`) inside shared memory operations, and enforce appropriate WebGPU command encoder pipeline dependencies between distinct kernel dispatches.",
    "good_code": "@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) global_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {\n  tileData[local_id.x] = inputBuffer[global_id.x];\n  workgroupBarrier(); // Synchronize shared workgroup execution\n  let accumulated = tileData[63 - local_id.x] * 2.0;\n  outputBuffer[global_id.x] = accumulated;\n}",
    "verification": "Enable Chrome WebGPU validation layers (`chrome://flags/#enable-webgpu-developer-features`) and run validation passes using GPUBuffer maps to ensure uniform tensor outputs across multiple runs.",
    "date": "2026-07-24",
    "id": 1784857776,
    "type": "error"
});