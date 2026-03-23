window.onPostDataLoaded({
    "title": "Fixing WebGPU Command Buffer Synchronization Races",
    "slug": "webgpu-command-buffer-sync-races",
    "language": "TypeScript",
    "code": "RaceCondition",
    "tags": [
        "TypeScript",
        "Frontend",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>In WebGPU multi-pass rendering, synchronization races occur when a compute or render pass attempts to read from a resource (like a texture or buffer) that is still being written to by a previous pass in the same command encoder. Unlike WebGL, WebGPU requires explicit management of resource states. If passes are not correctly separated or if the pipeline doesn't define clear read/write dependencies, the GPU may execute commands out of order, leading to flickering or corrupted frames.</p>",
    "root_cause": "Attempting to use a resource in a RenderPass without ensuring the previous ComputePass has finished writing and transitioned the resource state.",
    "bad_code": "const commandEncoder = device.createCommandEncoder();\nconst computePass = commandEncoder.beginComputePass();\ncomputePass.setPipeline(computePipeline);\ncomputePass.dispatchWorkgroups(64);\ncomputePass.end(); // Data might not be visible to render pass yet\n\nconst renderPass = commandEncoder.beginRenderPass(renderPassDesc);\nrenderPass.setPipeline(renderPipeline);\nrenderPass.draw(3);\nrenderPass.end();\ndevice.queue.submit([commandEncoder.finish()]);",
    "solution_desc": "Ensure that resource dependencies are handled by separate command submissions if necessary, or use storage textures with appropriate usage flags and ensure no conflicting workgroups are overlapping.",
    "good_code": "const commandEncoder = device.createCommandEncoder();\n// Pass 1: Compute\nconst computePass = commandEncoder.beginComputePass();\ncomputePass.setPipeline(computePipeline);\ncomputePass.dispatchWorkgroups(64);\ncomputePass.end();\n\n// WebGPU handles synchronization between passes in one encoder \n// IF resources are correctly bound. Ensure usage flags include \n// COPY_SRC/DST or STORAGE_BINDING for transitions.\n\nconst renderPass = commandEncoder.beginRenderPass(renderPassDesc);\nrenderPass.setPipeline(renderPipeline);\nrenderPass.setBindGroup(0, bindGroupWithComputeOutput);\nrenderPass.draw(3);\nrenderPass.end();\ndevice.queue.submit([commandEncoder.finish()]);",
    "verification": "Use the WebGPU 'Error Scope' API or a tool like 'SpectorJS' to check for validation errors related to resource usage transitions.",
    "date": "2026-03-23",
    "id": 1774228823,
    "type": "error"
});