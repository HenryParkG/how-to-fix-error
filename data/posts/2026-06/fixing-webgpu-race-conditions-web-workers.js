window.onPostDataLoaded({
    "title": "Fixing WebGPU Command Buffer Race Conditions",
    "slug": "fixing-webgpu-race-conditions-web-workers",
    "language": "TypeScript",
    "code": "GPUDeviceLost / Race Condition",
    "tags": [
        "TypeScript",
        "WebGPU",
        "React",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>When parallelizing WebGPU render passes across multiple Web Workers, race conditions can occur if multiple threads attempt to record commands into a shared command encoder concurrently. WebGPU command encoders are stateful and not thread-safe. Attempting to encode draw calls simultaneously from Web Workers or submitting out-of-order buffers results in validation errors.</p><p>This validation failure causes the WebGPU device to trigger a GPUDeviceLost event with an 'internal' or 'validation' reason, shutting down the rendering pipeline across all threads. To execute multi-threaded rendering successfully, each worker must have its own command encoder, compile its commands independently, and pass the resulting command buffers back to the main thread.</p>",
    "root_cause": "Concurrent invocation of commands on a shared GPUCommandEncoder, or improper synchronization when submitting multi-threaded command buffers to the GPUQueue.",
    "bad_code": "// Worker attempting to record commands directly to a shared, global encoder\nself.onmessage = async (e) => {\n  const { sharedEncoder, pipeline } = e.data;\n  // Race condition: Multiple workers writing to the same encoder instance concurrently\n  const passEncoder = sharedEncoder.beginRenderPass(renderPassDesc);\n  passEncoder.setPipeline(pipeline);\n  passEncoder.draw(3);\n  passEncoder.end();\n};",
    "solution_desc": "Each Web Worker must instantiate its own GPUDevice and GPUCommandEncoder, record drawing actions to separate GPUCommandBuffers, and then transfer those serialized command buffers back to the main thread via postMessage. The main thread then submits them sequentially to the GPUQueue.",
    "good_code": "// Worker records commands locally and transfers the buffer back\nself.onmessage = async (e) => {\n  const { device, pipeline } = e.data;\n  const localEncoder = device.createCommandEncoder();\n  const passEncoder = localEncoder.beginRenderPass(renderPassDesc);\n  passEncoder.setPipeline(pipeline);\n  passEncoder.draw(3);\n  passEncoder.end();\n  \n  const commandBuffer = localEncoder.finish();\n  // Pass the command buffer back to the main thread coordinator\n  self.postMessage({ commandBuffer }, [commandBuffer]);\n};",
    "verification": "Monitor the console for GPUDeviceLost events. Add a `device.lost.then((info) => { console.error(info.message); })` listener. Use WebGPU Error Scopes to capture validation errors during execution and verify zero errors are reported.",
    "date": "2026-06-21",
    "id": 1782026859,
    "type": "error"
});