window.onPostDataLoaded({
    "title": "Debugging WebGPU Resource State Tracking Hazards",
    "slug": "webgpu-resource-synchronization-hazards",
    "language": "TypeScript",
    "code": "SynchronizationError",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebGPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU moves resource management from the driver to the developer. A common synchronization hazard occurs when a resource (like a GPUBuffer) is used in multiple passes or commands without explicitly managing its state transitions. If a buffer is being written to by a compute shader and read by a vertex shader in the same command submission without a clear dependency barrier, the GPU might read stale or undefined data due to race conditions.</p>",
    "root_cause": "Attempting to use a resource in a way that conflicts with its current usage state within the same command buffer, violating WebGPU's strict internal state tracking.",
    "bad_code": "const commandEncoder = device.createCommandEncoder();\nconst computePass = commandEncoder.beginComputePass();\ncomputePass.setPipeline(computePipeline);\ncomputePass.dispatchWorkgroups(64);\ncomputePass.end();\n\n// Error: Buffer used here while still 'owned' or not synced from computePass\nconst renderPass = commandEncoder.beginRenderPass(renderPassDesc);\nrenderPass.setVertexBuffer(0, sharedBuffer);\nrenderPass.end();",
    "solution_desc": "WebGPU handles some synchronization automatically between passes, but hazards occur if the buffer usage flags are incorrect or if you attempt to map a buffer before the GPU is finished with it. Ensure the `usage` bitmask is correct and use `device.queue.onSubmittedWorkDone()` or proper pass ordering to manage dependencies.",
    "good_code": "const commandEncoder = device.createCommandEncoder();\n// Pass 1: Write to buffer\nconst pass1 = commandEncoder.beginComputePass();\npass1.setPipeline(pipeline1);\npass1.dispatchWorkgroups(1);\npass1.end();\n\n// WebGPU inserts an execution dependency here because of the pass boundary\n// Pass 2: Read from buffer\nconst pass2 = commandEncoder.beginRenderPass(renderPassDesc);\npass2.setPipeline(pipeline2);\npass2.draw(3);\npass2.end();\n\ndevice.queue.submit([commandEncoder.finish()]);",
    "verification": "Enable 'WebGPU Validation Errors' in browser console. Use the Chrome WebGPU Inspector extension to visualize resource state transitions.",
    "date": "2026-03-09",
    "id": 1773018969,
    "type": "error"
});