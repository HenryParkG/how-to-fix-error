window.onPostDataLoaded({
    "title": "Debugging WebGPU Compute Shader Synchronization Races",
    "slug": "webgpu-compute-shader-sync-races",
    "language": "TypeScript",
    "code": "RaceCondition",
    "tags": [
        "WebGPU",
        "TypeScript",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU multi-pass pipelines often reuse the same GPUBuffer across different compute passes. A synchronization race occurs when Pass B attempts to read from a buffer before Pass A has finished writing to it. Unlike WebGL, WebGPU requires explicit management of command execution and resource state transitions.</p><p>While WebGPU guarantees that commands within a single 'submit' call appear to execute in order, the hardware may overlap executions if there are no explicit dependencies or if storage buffers are accessed without proper usage flags.</p>",
    "root_cause": "Missing memory barriers between compute passes and improper use of 'storage' vs 'uniform' buffer usage flags, leading to 'Write-After-Read' or 'Read-After-Write' hazards.",
    "bad_code": "const encoder = device.createCommandEncoder();\nconst pass1 = encoder.beginComputePass();\npass1.setPipeline(pipeline1);\npass1.dispatchWorkgroups(64);\npass1.end();\n\nconst pass2 = encoder.beginComputePass();\npass2.setPipeline(pipeline2);\npass2.dispatchWorkgroups(64);\npass2.end();\ndevice.queue.submit([encoder.finish()]);",
    "solution_desc": "Ensure that the buffer is defined with 'GPUBufferUsage.STORAGE' and use a single ComputePass if possible. If multiple passes are required, rely on the fact that WebGPU inserts automatic barriers between passes in the same encoder if the resources overlap, but explicitly verify buffer usage transitions if using multiple encoders.",
    "good_code": "const encoder = device.createCommandEncoder();\n// Pass 1 writes to buffer A\nconst pass1 = encoder.beginComputePass();\npass1.setPipeline(pipeline1);\npass1.setBindGroup(0, bindGroupA);\npass1.dispatchWorkgroups(64);\npass1.end();\n\n// Pass 2 reads from buffer A; WebGPU handles the barrier here\nconst pass2 = encoder.beginComputePass();\npass2.setPipeline(pipeline2);\npass2.setBindGroup(0, bindGroupB);\npass2.dispatchWorkgroups(64);\npass2.end();\n\ndevice.queue.submit([encoder.finish()]);",
    "verification": "Enable 'Validation Layers' in the browser or use a GPU debugger like RenderDoc to inspect the 'Resource Barrier' calls between draw/dispatch commands.",
    "date": "2026-03-01",
    "id": 1772340541,
    "type": "error"
});