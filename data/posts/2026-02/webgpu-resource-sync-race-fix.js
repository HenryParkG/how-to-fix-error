window.onPostDataLoaded({
    "title": "Fixing WebGPU Resource Synchronization Races",
    "slug": "webgpu-resource-sync-race-fix",
    "language": "TypeScript",
    "code": "SYNC_RACE",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU operates with an explicit synchronization model. A common error occurs when a Compute Shader writes to a GPUBuffer that is subsequently read by a Render Pipeline in the same command submission. Without a proper memory barrier or correct usage of pipeline stages, the GPU may attempt to read the buffer before the compute write has finished, resulting in flickering or incorrect data visualization.</p>",
    "root_cause": "Missing storage-to-vertex buffer barriers and incorrect command encoder pass ordering.",
    "bad_code": "const commandEncoder = device.createCommandEncoder();\nconst computePass = commandEncoder.beginComputePass();\ncomputePass.setPipeline(computePipeline);\ncomputePass.dispatchWorkgroups(64);\ncomputePass.end();\n\nconst renderPass = commandEncoder.beginRenderPass(renderPassDesc);\n// Race condition: render pass reads buffer while compute might still be writing\nrenderPass.setVertexBuffer(0, storageBuffer);\nrenderPass.draw(3);\nrenderPass.end();",
    "solution_desc": "Ensure that the buffer usage includes both STORAGE and VERTEX/INDEX flags, and use a single command encoder to strictly sequence the passes. WebGPU implicitly handles transitions between passes in a single encoder, but the buffer must be declared with appropriate usage flags.",
    "good_code": "const storageBuffer = device.createBuffer({\n  size: 65536,\n  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST\n});\n\nconst commandEncoder = device.createCommandEncoder();\nconst computePass = commandEncoder.beginComputePass();\ncomputePass.setPipeline(computePipeline);\ncomputePass.setBindGroup(0, bindGroup);\ncomputePass.dispatchWorkgroups(64);\ncomputePass.end();\n\n// The implementation automatically inserts a barrier here\nconst renderPass = commandEncoder.beginRenderPass(renderPassDesc);\nrenderPass.setPipeline(renderPipeline);\nrenderPass.setVertexBuffer(0, storageBuffer);\nrenderPass.draw(1000);\nrenderPass.end();\n\ndevice.queue.submit([commandEncoder.finish()]);",
    "verification": "Use the browser's WebGPU inspection tools or the 'WebGPU Error Scope' to check for validation errors related to resource contention.",
    "date": "2026-02-19",
    "id": 1771483916,
    "type": "error"
});