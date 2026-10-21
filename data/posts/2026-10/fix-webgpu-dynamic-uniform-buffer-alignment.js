window.onPostDataLoaded({
    "title": "Fix WebGPU Dynamic Uniform Buffer Alignment",
    "slug": "fix-webgpu-dynamic-uniform-buffer-alignment",
    "language": "TypeScript",
    "code": "WebGPUAlignmentError",
    "tags": [
        "TypeScript",
        "WebGPU",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU enforces strict memory alignment rules when binding dynamic uniform buffers via <code>setBindGroup</code> with dynamic offsets. Unlike WebGL, where drivers often mask non-compliant offsets, WebGPU mandates that every dynamic buffer offset must be an exact multiple of the device limit <code>minUniformBufferOffsetAlignment</code>.</p><p>This hardware limit is commonly 256 bytes on Apple Silicon and modern desktop Vulkan drivers, though it can be smaller on other hardware. If an application assumes a 16-byte or 64-byte matrix stride, the browser validation layer throws a pipeline execution error and immediately aborts the current command buffer submission.</p>",
    "root_cause": "Dynamic uniform offsets passed into `GPUComputePassEncoder.setBindGroup` or `GPURenderPassEncoder.setBindGroup` violate the device limit constraint `offset % device.limits.minUniformBufferOffsetAlignment === 0`.",
    "bad_code": "const structSize = 64; // 4x4 transform matrix (16 floats * 4 bytes)\n\nfor (let i = 0; i < objectCount; i++) {\n  // FAILS: dynamicOffset is not a multiple of 256 on many GPUs\n  const dynamicOffset = i * structSize;\n  passEncoder.setBindGroup(0, uniformBindGroup, [dynamicOffset]);\n  passEncoder.draw(36);\n}",
    "solution_desc": "Query `device.limits.minUniformBufferOffsetAlignment` at initialization time and compute a dynamically aligned stride using mathematical ceiling rounding before writing uniform memory slices and binding offsets.",
    "good_code": "function getAlignedStride(structBytes: number, alignment: number): number {\n  return Math.ceil(structBytes / alignment) * alignment;\n}\n\nconst minAlign = device.limits.minUniformBufferOffsetAlignment; // Typically 256\nconst structBytes = 64;\nconst alignedStride = getAlignedStride(structBytes, minAlign);\n\nfor (let i = 0; i < objectCount; i++) {\n  const dynamicOffset = i * alignedStride;\n  // Fully compliant with hardware alignment specifications\n  passEncoder.setBindGroup(0, uniformBindGroup, [dynamicOffset]);\n  passEncoder.draw(36);\n}",
    "verification": "Enable dynamic validation wrappers using `device.pushErrorScope('validation')` across both macOS (Metal) and Windows (Vulkan/Direct3D12) instances, confirming no alignment assertion errors are raised during render loops.",
    "date": "2026-10-21",
    "id": 1792550056,
    "type": "error"
});