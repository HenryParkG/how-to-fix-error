window.onPostDataLoaded({
    "title": "Fix WebGPU Compute Barrier Races & Alignment Faults",
    "slug": "webgpu-compute-barrier-races-alignment-faults",
    "language": "TypeScript",
    "code": "GPU_ALIGNMENT_BARRIER_FAULT",
    "tags": [
        "TypeScript",
        "Frontend",
        "Graphics",
        "WebGPU",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>When executing parallel reduction or matrix multiplication shaders in WebGPU via TypeScript, developers frequently encounter non-deterministic computation outputs and browser GPU process crashes. These stem from missing memory barriers in shared workgroup memory (`var<workgroup>`) and host-side buffer alignment mismatches.</p><p>WebGPU (WGSL) mandates strict struct member memory alignment (e.g., `vec3<f32>` has an alignment requirement of 16 bytes, not 12). When host buffers created in TypeScript via standard typed arrays do not match uniform and storage alignment offsets, data unpacks with corrupted offsets. Furthermore, parallel invocations accessing shared memory without explicit `workgroupBarrier()` invocations cause warp-level race conditions.</p>",
    "root_cause": "Race conditions in workgroup memory access due to missing synchronization barriers, coupled with WGSL uniform/storage buffer alignment violations between JavaScript Float32Array layouts and WebGPU memory layouts.",
    "bad_code": "/* WGSL Shader */\nstruct Uniforms {\n    multiplier: f32,\n    offset: vec3<f32>, // BUG: Alignment fault! Expected offset at byte 16, but follows 4-byte f32\n};\n\nvar<workgroup> shared_data: array<f32, 64>;\n\n@compute @workgroup_size(64)\nfn main(@builtin(local_invocation_id) local_id: vec3<u32>) {\n    shared_data[local_id.x] = fetch_val(local_id.x);\n    // BUG: Missing workgroupBarrier() before parallel reduction\n    if (local_id.x < 32u) {\n        shared_data[local_id.x] += shared_data[local_id.x + 32u];\n    }\n}\n\n/* TypeScript Host */\nconst uniformBufferData = new Float32Array([1.5, 0.1, 0.2, 0.3]); // Misaligned packed array",
    "solution_desc": "Enforce explicit padding in WGSL structs to align fields on 16-byte boundaries (or use `@align(16)` annotations). Insert `workgroupBarrier()` synchronization calls before cross-thread reads from workgroup memory, and ensure host-side array buffers account for WGSL padding.",
    "good_code": "/* WGSL Shader */\nstruct Uniforms {\n    multiplier: f32,\n    _padding: vec3<f32>, // Explicitly pad to 16 bytes\n    offset: vec3<f32>,\n    _padding2: f32,\n};\n\n@group(0) @binding(0) var<uniform> params: Uniforms;\nvar<workgroup> shared_data: array<f32, 64>;\n\n@compute @workgroup_size(64)\nfn main(@builtin(local_invocation_id) local_id: vec3<u32>) {\n    shared_data[local_id.x] = fetch_val(local_id.x) * params.multiplier;\n    \n    // Synchronize workgroup threads before reduction\n    workgroupBarrier();\n    \n    for (var s = 32u; s > 0u; s >>= 1u) {\n        if (local_id.x < s) {\n            shared_data[local_id.x] += shared_data[local_id.x + s];\n        }\n        workgroupBarrier(); // Synchronize on each reduction step\n    }\n}\n\n/* TypeScript Host */\nconst uniformBufferData = new Float32Array([\n    1.5, 0.0, 0.0, 0.0,  // multiplier + 12-byte padding\n    0.1, 0.2, 0.3, 0.0   // offset (vec3) + 4-byte padding\n]);\ndevice.queue.writeBuffer(uniformBuffer, 0, uniformBufferData.buffer);",
    "verification": "Enable WebGPU validation layers in browser runtime (`chrome://flags/#enable-unsafe-webgpu`). Execute 1,000 reduction passes against synthetic ground-truth datasets to verify zero validation warnings and 100% deterministic output equality.",
    "date": "2026-08-14",
    "id": 1786682598,
    "type": "error"
});