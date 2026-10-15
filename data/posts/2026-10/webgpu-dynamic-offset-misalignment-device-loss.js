window.onPostDataLoaded({
    "title": "Fixing WebGPU Dynamic Offset Misalignments & Device Loss",
    "slug": "webgpu-dynamic-offset-misalignment-device-loss",
    "language": "TypeScript",
    "code": "GPUValidationError",
    "tags": [
        "WebGPU",
        "Graphics",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU provides direct, lower-overhead access to modern GPU hardware compared to WebGL, but it enforces strict validation rules at command encoding time. When binding dynamic uniform or storage buffers using <code>GPURenderPassEncoder.setBindGroup()</code> with dynamic offsets, the offsets must strictly adhere to the alignment limitations of the physical GPU adapter.</p><p>Most desktop and mobile hardware mandates that dynamic uniform buffer offsets be integer multiples of <code>minUniformBufferOffsetAlignment</code> (commonly 256 bytes), while dynamic storage buffers must align with <code>minStorageBufferOffsetAlignment</code>. Supplying a non-conforming offset generates a synchronous <code>GPUValidationError</code>. If the application does not handle the error or continues pipeline execution with invalid command buffers, WebGPU irrevocably destroys the underlying <code>GPUDevice</code>, causing silent rendering freezes and unhandled promise rejections.</p>",
    "root_cause": "Dynamic buffer offsets passed to `setBindGroup()` violate hardware alignment constraints dictated by `device.limits.minUniformBufferOffsetAlignment`, triggering validation failures that lead to device destruction.",
    "bad_code": "// Naive byte alignment assuming simple 16-byte float4 matrix strides\nconst matrixSize = 64; // 4x4 matrix (16 floats * 4 bytes)\nconst dynamicOffset = objectIndex * matrixSize; \n\n// Fails on hardware where minUniformBufferOffsetAlignment is 256 bytes!\nrenderPassEncoder.setBindGroup(0, uniformBindGroup, [dynamicOffset]);\nrenderPassEncoder.draw(36);\n// Browser console: [GPUValidationError: Offset is not aligned to 256 bytes]\n// Subsequent frames trigger device lost: device.lost -> \"Device was lost due to invalid command execution\"",
    "solution_desc": "Calculate per-object buffer strides dynamically using the adapter limits discovered at device initialization. Pad each dynamic allocation chunk using bitwise math to ensure offsets are clean multiples of `minUniformBufferOffsetAlignment`, and attach an uncaptured error listener on the device to debug edge cases before device detachment occurs.",
    "good_code": "function getAlignedStride(sourceSize: number, alignment: number): number {\n    return Math.ceil(sourceSize / alignment) * alignment;\n}\n\nconst alignment = device.limits.minUniformBufferOffsetAlignment; // e.g., 256\nconst alignedStride = getAlignedStride(64, alignment);\n\n// Allocate buffer sized according to aligned strides\nconst dynamicOffset = objectIndex * alignedStride;\n\n// Safe binding\nrenderPassEncoder.setBindGroup(0, uniformBindGroup, [dynamicOffset]);\n\ndevice.addEventListener('uncapturederror', (event: GPUUncapturedErrorEvent) => {\n    console.error('WebGPU uncaptured error:', event.error.message);\n});",
    "verification": "Check `device.lost.then(...)` promises in integration tests, ensure no validation errors appear in browser developer consoles, and verify render output across heterogeneous hardware (e.g., Apple Silicon vs. NVIDIA GPUs).",
    "date": "2026-10-15",
    "id": 1792031084,
    "type": "error"
});