window.onPostDataLoaded({
    "title": "Mitigating WebGPU Resource Synchronization Races",
    "slug": "webgpu-resource-sync-races",
    "language": "TypeScript",
    "code": "GPURenderPassEncoder-Race",
    "tags": [
        "TypeScript",
        "Frontend",
        "GPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU operates with an explicit synchronization model. Race conditions occur when multiple compute shader dispatches or render passes attempt to access the same <code>GPUBuffer</code> or <code>GPUTexture</code> without explicit barriers. Because GPU commands are queued and executed asynchronously, a read might occur before a previous write has finished.</p><p>Unlike WebGL, WebGPU does not automatically track dependencies between passes, meaning the developer is responsible for ensuring that data is visible to the next stage of the pipeline.</p>",
    "root_cause": "Lack of proper usage of 'storage' binding limits or failure to utilize multiple passes with appropriate buffer usage flags when data dependencies exist between compute stages.",
    "bad_code": "const commandEncoder = device.createCommandEncoder();\nconst pass = commandEncoder.beginComputePass();\npass.setPipeline(pipelineA);\npass.dispatchWorkgroups(64);\n// Race condition: pipelineB starts before pipelineA finishes writing to shared buffer\npass.setPipeline(pipelineB);\npass.dispatchWorkgroups(64);\npass.end();",
    "solution_desc": "Separate the execution into multiple compute passes or use storage buffers with explicit memory barriers. In WebGPU, ending one pass and starting another on the same command encoder provides an implicit execution barrier for resources used in those passes.",
    "good_code": "const commandEncoder = device.createCommandEncoder();\n// First Pass: Write\nconst pass1 = commandEncoder.beginComputePass();\npass1.setPipeline(pipelineA);\npass1.dispatchWorkgroups(64);\npass1.end(); \n\n// Second Pass: Read (WebGPU ensures pass1 completes before pass2 starts on the same queue)\nconst pass2 = commandEncoder.beginComputePass();\npass2.setPipeline(pipelineB);\npass2.dispatchWorkgroups(64);\npass2.end();\n\ndevice.queue.submit([commandEncoder.finish()]);",
    "verification": "Use the Chrome/Edge 'WebGPU Inspector' or enable validation layers to check for 'Resource Usage Tracking' errors or data races in the command stream.",
    "date": "2026-02-25",
    "id": 1771994919,
    "type": "error"
});