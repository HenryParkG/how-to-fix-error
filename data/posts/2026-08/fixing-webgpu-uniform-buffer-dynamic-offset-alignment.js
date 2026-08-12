window.onPostDataLoaded({
    "title": "Fixing WebGPU Dynamic Offset Alignment Faults",
    "slug": "fixing-webgpu-uniform-buffer-dynamic-offset-alignment",
    "language": "TypeScript",
    "code": "AlignmentFault",
    "tags": [
        "TypeScript",
        "WebGPU",
        "WGSL",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>When executing concurrent compute shaders in WebGPU, utilizing dynamic uniform offsets via <code>GPURenderPassEncoder.setBindGroup()</code> or <code>GPUComputePassEncoder.setBindGroup()</code> allows developers to bind a single large <code>GPUBuffer</code> and pass varying byte offsets per dispatch. However, WebGPU enforces strict alignment constraints dictated by <code>GPUDevice.limits.minUniformBufferOffsetAlignment</code> (typically 256 bytes on modern GPUs). Failing to pad dynamic buffer offset strides to exact multiples of this limit causes a hard GPU validation error during command buffer submission, breaking concurrent execution pipelines.</p>",
    "root_cause": "The dynamic offset passed to `setBindGroup()` was computed based strictly on the struct size (e.g., 64 bytes for a 4x4 float matrix) rather than aligned to `device.limits.minUniformBufferOffsetAlignment` (256 bytes), triggering WebGPU validation layer errors upon pass execution.",
    "bad_code": "// Buggy buffer allocation and bind group dispatch\nconst structSize = 64; // 16 floats (4x4 matrix)\nconst numInstances = 100;\n\nconst uniformBuffer = device.createBuffer({\n  size: structSize * numInstances, // 6400 bytes - NOT ALIGNED\n  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\n});\n\nfor (let i = 0; i < numInstances; i++) {\n  // FAILS: 'i * 64' is not a multiple of minUniformBufferOffsetAlignment (256)\n  passEncoder.setBindGroup(0, bindGroup, [i * structSize]);\n}",
    "solution_desc": "Calculate the padded byte stride using the formula `Math.ceil(structSize / alignment) * alignment`. Ensure both the buffer creation size and the dynamic offset array elements adhere to this calculated stride.",
    "good_code": "// Fixed buffer allocation with dynamic offset alignment\nconst structSize = 64; // 16 floats\nconst alignment = device.limits.minUniformBufferOffsetAlignment; // Guaranteed 256 or lower\nconst alignedStride = Math.ceil(structSize / alignment) * alignment; // 256 bytes\nconst numInstances = 100;\n\nconst uniformBuffer = device.createBuffer({\n  size: alignedStride * numInstances,\n  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\n});\n\nfor (let i = 0; i < numInstances; i++) {\n  const dynamicOffset = i * alignedStride; // Valid offset multiple of 256\n  passEncoder.setBindGroup(0, bindGroup, [dynamicOffset]);\n}",
    "verification": "Enable WebGPU validation errors (`device.pushErrorScope('validation')`) or check browser console outputs. Verify that `setBindGroup` dispatches without unaligned offset errors and monitor compute shader execution stability under concurrent workloads.",
    "date": "2026-08-12",
    "id": 1786518535,
    "type": "error"
});