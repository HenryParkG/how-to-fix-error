window.onPostDataLoaded({
    "title": "Fix WebGPU Resource Races in Multi-Pass Pipelines",
    "slug": "webgpu-resource-sync-races",
    "language": "TypeScript",
    "code": "GPU_SYNC_ERROR",
    "tags": [
        "TypeScript",
        "WebGPU",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU synchronization issues often arise in multi-pass compute pipelines when a buffer is written to in one pass and read from in another. While WebGPU provides implicit synchronization within a single pass, cross-pass dependencies require explicit management. A common race occurs when the <code>GPUCommandEncoder</code> is not properly instructed to wait for a storage write to complete before a subsequent read, or when buffer usage flags are incorrectly configured for simultaneous access.</p>",
    "root_cause": "Failure to ensure the GPU has finished writing to a buffer in a previous compute pass before starting a new pass that reads from that same buffer, often caused by missing buffer usage transitions or improper command submission ordering.",
    "bad_code": "const encoder = device.createCommandEncoder();\nconst pass1 = encoder.beginComputePass();\npass1.setPipeline(pipelineA);\npass1.setBindGroup(0, bindGroupA); // Writes to Buffer X\npass1.dispatchWorkgroups(64);\npass1.end();\n\nconst pass2 = encoder.beginComputePass();\npass2.setPipeline(pipelineB);\npass2.setBindGroup(0, bindGroupB); // Reads from Buffer X\npass2.dispatchWorkgroups(64);\npass2.end();\ndevice.queue.submit([encoder.finish()]);",
    "solution_desc": "To fix this, ensure that 'Buffer X' includes the necessary usage flags (STORAGE | COPY_SRC) and that you are not attempting to map the buffer while it is still in use by the GPU. In WebGPU, the 'end()' call on the first pass creates a dependency barrier for the next pass in the same command buffer. However, if the data needs to be accessed by the CPU, a mapAsync call must follow a complete submission.",
    "good_code": "const bufferX = device.createBuffer({\n  size: 1024,\n  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST\n});\n\nconst encoder = device.createCommandEncoder();\nconst pass1 = encoder.beginComputePass();\n// ... setup and dispatch pass1 (writes to bufferX)\npass1.end();\n\n// Explicitly finish the command buffer to ensure sequential execution on the queue\nconst commandBuffer = encoder.finish();\ndevice.queue.submit([commandBuffer]);\n\n// For CPU access, ensure mapping occurs after queue work is done\nawait bufferX.mapAsync(GPUMapMode.READ);",
    "verification": "Use the Chrome 'WebGPU Internals' tool to inspect the resource state and check for 'Validation Errors' in the console during the transition between compute passes.",
    "date": "2026-03-21",
    "id": 1774066976,
    "type": "error"
});