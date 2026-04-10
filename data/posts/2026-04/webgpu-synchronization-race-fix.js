window.onPostDataLoaded({
    "title": "Fixing WebGPU Buffer Synchronization Race Conditions",
    "slug": "webgpu-synchronization-race-fix",
    "language": "TypeScript",
    "code": "GPURaceCondition",
    "tags": [
        "TypeScript",
        "Next.js",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU is explicitly multi-threaded by design. Unlike WebGL, it doesn't perform automatic resource tracking. A common error occurs when a developer submits a Compute Pass to modify a buffer and immediately follows it with a Render Pass that reads that buffer without a proper pipeline barrier or sequential submission.</p><p>This results in 'flickering' or 'stale data' because the GPU might start the Render Pass before the Compute Pass has finished writing to the memory, leading to non-deterministic behavior.</p>",
    "root_cause": "Concurrent access to a GPUBuffer across different passes without a command encoder sequence or buffer mapping synchronization.",
    "bad_code": "const encoder = device.createCommandEncoder();\nconst computePass = encoder.beginComputePass();\ncomputePass.setPipeline(computePipeline);\ncomputePass.dispatchWorkgroups(64);\ncomputePass.end();\n\nconst renderPass = encoder.beginRenderPass(renderPassDesc);\nrenderPass.setPipeline(renderPipeline);\nrenderPass.draw(3);\nrenderPass.end();\n\ndevice.queue.submit([encoder.finish()]);",
    "solution_desc": "Ensure that the buffer usage flags include both STORAGE and VERTEX/INDEX. Use a single Command Encoder to sequence the passes. If reading back to the CPU, you MUST use 'mapAsync' and 'await' to ensure the GPU has finished the work.",
    "good_code": "// Ensure buffer is created with proper usage\nconst buffer = device.createBuffer({\n    size: 1024, \n    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC\n});\n\n// To read safely: \nawait device.queue.onSubmittedWorkDone();\nawait buffer.mapAsync(GPUMapMode.READ);\nconst copy = buffer.getMappedRange().slice(0);\nbuffer.unmap();",
    "verification": "Use Chrome 'GPU Internals' or a WebGPU debugger to verify that 'CommandEncoder' execution is strictly sequential and no validation errors appear in the console.",
    "date": "2026-04-10",
    "id": 1775815328,
    "type": "error"
});