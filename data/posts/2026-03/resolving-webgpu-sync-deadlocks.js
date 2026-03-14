window.onPostDataLoaded({
    "title": "Solving WebGPU Multi-Pass Pipeline Deadlocks",
    "slug": "resolving-webgpu-sync-deadlocks",
    "language": "TypeScript",
    "code": "SynchronizationDeadlock",
    "tags": [
        "TypeScript",
        "WebGPU",
        "Graphics",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU compute pipelines often involve multiple passes where one pass writes to a storage buffer and the next reads from it. A common deadlock occurs when developers attempt to map a buffer for CPU access or issue new commands before previous GPU work is finished, or when circular dependencies are created in the command encoder without proper visibility barriers.</p>",
    "root_cause": "Attempting to call 'buffer.mapAsync()' or submitting commands that depend on unfinished buffer writes without ensuring the GPU has completed previous execution stages.",
    "bad_code": "const commandEncoder = device.createCommandEncoder();\nconst pass = commandEncoder.beginComputePass();\npass.setPipeline(pipeline);\npass.dispatchWorkgroups(64);\npass.end();\n\n// Error: Buffer is still locked by the GPU/Queue\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange();",
    "solution_desc": "Use 'device.queue.onSubmittedWorkDone()' to ensure the GPU is idle before mapping buffers, or strictly manage the 'GPUCommandEncoder' lifecycle and use explicit 'copyBufferToBuffer' calls to move data to a map-ready staging buffer.",
    "good_code": "const commandEncoder = device.createCommandEncoder();\n// ... compute pass logic ...\ndevice.queue.submit([commandEncoder.finish()]);\n\n// Correctly wait for the queue to flush\nawait device.queue.onSubmittedWorkDone();\nawait stagingBuffer.mapAsync(GPUMapMode.READ);\nconst result = stagingBuffer.getMappedRange().slice(0);",
    "verification": "Run the application with the WebGPU 'validation layer' enabled. Ensure no 'Buffer is currently mapped' or 'Queue timeline' errors appear in the console during high-frequency compute dispatches.",
    "date": "2026-03-14",
    "id": 1773462516,
    "type": "error"
});