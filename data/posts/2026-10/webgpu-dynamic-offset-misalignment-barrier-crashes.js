window.onPostDataLoaded({
    "title": "Resolving WebGPU Dynamic Offset & Barrier Crashes",
    "slug": "webgpu-dynamic-offset-misalignment-barrier-crashes",
    "language": "TypeScript",
    "code": "GPUValidationError",
    "tags": [
        "TypeScript",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU provides low-level control over hardware execution, but strictly enforces resource alignment and memory barrier constraints during validation. A frequent pitfall occurs when binding dynamic uniform or storage buffers via <code>setBindGroup()</code> with unaligned byte offsets.</p><p>WebGPU specifications require dynamic offsets to be precise multiples of <code>minUniformBufferOffsetAlignment</code> (commonly 256 bytes) or <code>minStorageBufferOffsetAlignment</code>. Providing an unpadded offset derived strictly from struct sizing generates immediate <code>GPUValidationError</code> exceptions and invalidates the command encoder stream.</p>",
    "root_cause": "Dynamic buffer offsets passed to setBindGroup fail to align with device hardware limits (minUniformBufferOffsetAlignment / minStorageBufferOffsetAlignment), triggering validation failure.",
    "bad_code": "const dynamicOffset = objectIndex * 64; // sizeof(mat4) is 64 bytes\n\npassEncoder.setBindGroup(0, uniformBindGroup, [\n  dynamicOffset // Throws GPUValidationError: offset is not aligned to 256 bytes\n]);",
    "solution_desc": "Query hardware alignment limits from the adapter/device, compute dynamically padded strides using bitwise alignment formulas, and pass correctly aligned offsets into the bind group invocation.",
    "good_code": "const alignment = device.limits.minUniformBufferOffsetAlignment;\nconst matrixByteSize = 64;\n// Pad offset to the nearest multiple of minUniformBufferOffsetAlignment\nconst alignedStride = Math.ceil(matrixByteSize / alignment) * alignment;\n\nconst dynamicOffset = objectIndex * alignedStride;\n\npassEncoder.setBindGroup(0, uniformBindGroup, [dynamicOffset]);",
    "verification": "Wrap command execution inside `device.pushErrorScope('validation')` and verify `await device.popErrorScope()` returns `null` without GPU validation warnings.",
    "date": "2026-10-31",
    "id": 1793417258,
    "type": "error"
});