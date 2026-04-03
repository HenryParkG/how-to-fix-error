window.onPostDataLoaded({
    "title": "Fixing WebGPU Compute Shader Race Conditions",
    "slug": "webgpu-compute-shader-race-fix",
    "language": "TypeScript",
    "code": "RaceCondition",
    "tags": [
        "TypeScript",
        "Next.js",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU compute shaders in browser-based ML often encounter race conditions when multiple workgroups attempt to write to the same storage buffer index simultaneously. Since GPU execution is massively parallel, without explicit synchronization, one workgroup may overwrite the results of another, leading to corrupted tensors or non-deterministic inference results.</p><p>This is particularly common in custom kernel implementations for operations like global sum reduction or matrix multiplication where partial sums are aggregated into a shared result buffer.</p>",
    "root_cause": "Concurrent write access to global memory without using atomic operations or workgroup barriers within the WGSL shader code.",
    "bad_code": "@group(0) @binding(0) var<storage, read_write> output: array<f32>;\n\n@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) id: vec3<u32>) {\n    // Direct write without synchronization\n    output[0] = output[0] + f32(id.x);\n}",
    "solution_desc": "Use atomic types (atomic<i32> or atomic<u32>) for shared global counters. If floating point precision is required, perform reduction within the workgroup using `workgroupBarrier()` and `workgroup` shared memory before committing a single write to the global storage buffer.",
    "good_code": "@group(0) @binding(0) var<storage, read_write> output: array<atomic<u32>>;\n\n@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) id: vec3<u32>) {\n    // Use atomicAdd for thread-safe accumulation\n    atomicAdd(&output[0], id.x);\n}",
    "verification": "Run the compute pass 100 times and verify the result consistency using `GPUBuffer.mapAsync()` to read back data for comparison.",
    "date": "2026-04-03",
    "id": 1775179639,
    "type": "error"
});