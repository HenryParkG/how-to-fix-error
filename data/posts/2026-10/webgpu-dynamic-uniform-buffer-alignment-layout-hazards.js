window.onPostDataLoaded({
    "title": "WebGPU Dynamic Uniform Buffer Alignment Panics & Hazards",
    "slug": "webgpu-dynamic-uniform-buffer-alignment-layout-hazards",
    "language": "TypeScript",
    "code": "GPUValidationError",
    "tags": [
        "WebGPU",
        "Graphics",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU introduces dynamic uniform and storage buffer bindings to allow single bind groups to supply per-object transformation matrices or material constants via byte offsets passed into <code>GPURenderPassEncoder.setBindGroup()</code>. This design eliminates the runtime overhead of repeatedly instantiating separate <code>GPUBindGroup</code> objects across thousands of render calls.</p><p>However, dynamic buffer offsets are subject to strict hardware hardware-dependent alignment rules dictated by <code>GPUAdapter.limits.minUniformBufferOffsetAlignment</code> (commonly 256 bytes). If dynamic byte offsets supplied in <code>setBindGroup()</code> fail to divide evenly by this threshold, WebGPU immediately throws a synchronous <code>GPUValidationError</code> and enters an unrecoverable invalid encoder state. Furthermore, mismatching <code>hasDynamicOffset: true</code> in the pipeline layout versus the WGSL descriptor results in pipeline execution aborts.</p>",
    "root_cause": "Buffer byte offsets supplied to passEncoder.setBindGroup are computed using raw struct byte sizes (e.g., 64 bytes for a 4x4 matrix) instead of padding each dynamic slot to the device's minUniformBufferOffsetAlignment requirement.",
    "bad_code": "// Raw 4x4 Float32Array matrix is 64 bytes\nconst MATRIX_STRIDE = 64;\nconst dynamicOffsets = new Uint32Array(instanceCount);\n\nfor (let i = 0; i < instanceCount; i++) {\n  // FAILS: 64, 128, 192 are not aligned to 256 bytes!\n  dynamicOffsets[i] = i * MATRIX_STRIDE;\n}\n\n// Generates GPUValidationError: dynamicOffset[1] (64) is not aligned to 256 bytes\npassEncoder.setBindGroup(0, uniformBindGroup, dynamicOffsets, 0, 1);\npassEncoder.draw(36);",
    "solution_desc": "Query `device.limits.minUniformBufferOffsetAlignment` at runtime, compute padded memory block strides using bitwise alignment formulas, ensure the staging allocation adheres to the aligned stride, and reflect dynamic offsets appropriately inside the GPUBindGroupLayout descriptor.",
    "good_code": "const minAlign = device.limits.minUniformBufferOffsetAlignment;\nconst matrixRawSize = 16 * Float32Array.BYTES_PER_ELEMENT; // 64 bytes\n// Compute aligned stride: alignTo(64, minAlign) -> 256 bytes\nconst alignedStride = Math.ceil(matrixRawSize / minAlign) * minAlign;\n\nconst uniformBuffer = device.createBuffer({\n  size: alignedStride * maxInstances,\n  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,\n});\n\n// Write matrix using aligned stride offsets\nfor (let i = 0; i < maxInstances; i++) {\n  device.queue.writeBuffer(uniformBuffer, i * alignedStride, transformMatrices[i]);\n}\n\n// Dispatch render with properly aligned dynamic offset\nconst dynamicOffset = activeInstanceIndex * alignedStride;\npassEncoder.setBindGroup(0, uniformBindGroup, [dynamicOffset]);\npassEncoder.draw(36);",
    "verification": "Wrap test rendering loops inside `device.pushErrorScope('validation')` and `await device.popErrorScope()` to assert zero validation errors across varying simulated adapter alignment limits (64, 128, and 256 bytes).",
    "date": "2026-10-05",
    "id": 1791169719,
    "type": "error"
});