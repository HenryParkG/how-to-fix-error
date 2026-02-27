window.onPostDataLoaded({
    "title": "Resolving WebGPU Memory Alignment Violations",
    "slug": "webgpu-memory-alignment-violations-fix",
    "language": "TypeScript",
    "code": "AlignmentError",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebGPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU compute pipelines often fail with validation errors during <code>writeBuffer</code> or <code>setBindGroup</code> operations because of strict alignment rules. Specifically, uniform buffer offsets must be multiples of 256 bytes, and data structures within WGSL shaders must follow the std140/std430 layout rules. Mismatches between the CPU-side byte array and the GPU-side struct definition lead to 'corrupted' values or pipeline crashes.</p>",
    "root_cause": "Buffer offsets not meeting the 'minUniformBufferOffsetAlignment' (256 bytes) or struct members violating the 16-byte vec4 alignment boundary.",
    "bad_code": "const buffer = device.createBuffer({\n    size: 64, // Too small for multiple dynamic offsets\n    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\n});\n// Error: dynamic offset must be multiple of 256\ndevice.queue.writeBuffer(buffer, 32, float32Array);",
    "solution_desc": "Calculate the padded size of structures to ensure they align with 256-byte boundaries for dynamic offsets. Use <code>Math.ceil(byteSize / 256) * 256</code> to determine valid strides.",
    "good_code": "const alignment = device.limits.minUniformBufferOffsetAlignment;\nconst alignedSize = Math.ceil(structSize / alignment) * alignment;\n\nconst buffer = device.createBuffer({\n    size: alignedSize * totalElements,\n    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\n});\n\n// Correctly write at aligned boundary\ndevice.queue.writeBuffer(buffer, alignedSize, float32Array);",
    "verification": "Check the Chrome DevTools 'WebGPU' tab for Validation Errors or use the 'GPUDevice.pushErrorScope' API to catch alignment errors.",
    "date": "2026-02-27",
    "id": 1772154799,
    "type": "error"
});