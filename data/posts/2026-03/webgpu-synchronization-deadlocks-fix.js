window.onPostDataLoaded({
    "title": "Fixing WebGPU Synchronization Deadlocks",
    "slug": "webgpu-synchronization-deadlocks-fix",
    "language": "TypeScript",
    "code": "Deadlock",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebGPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU synchronization deadlocks typically occur in multi-pass compute pipelines when a resource (like a storage buffer) is bound for both reading and writing across different passes without proper command submission or visibility barriers. Unlike WebGL, WebGPU requires explicit management of resource states, and failing to finish a pass before starting another that depends on it can lead to GPU hangs or browser-level process crashes.</p>",
    "root_cause": "Attempting to use a GPUBuffer in a second compute pass before the first pass's command encoder has been finalized and submitted to the queue, creating a circular dependency in the command buffer.",
    "bad_code": "const commandEncoder = device.createCommandEncoder();\nconst pass1 = commandEncoder.beginComputePass();\npass1.setPipeline(pipeline1);\npass1.dispatchWorkgroups(64);\n// Missing pass1.end()\nconst pass2 = commandEncoder.beginComputePass();\npass2.setPipeline(pipeline2);\npass2.dispatchWorkgroups(64);\npass2.end();",
    "solution_desc": "Ensure every GPURenderPassEncoder or GPUComputePassEncoder is explicitly closed using .end() before starting a new pass that uses the same resources. Additionally, use device.queue.submit() at logical synchronization points to flush commands to the hardware.",
    "good_code": "const commandEncoder = device.createCommandEncoder();\nconst pass1 = commandEncoder.beginComputePass();\npass1.setPipeline(pipeline1);\npass1.dispatchWorkgroups(64);\npass1.end(); // Explicitly end pass\n\nconst pass2 = commandEncoder.beginComputePass();\npass2.setPipeline(pipeline2);\npass2.dispatchWorkgroups(64);\npass2.end();\n\ndevice.queue.submit([commandEncoder.finish()]);",
    "verification": "Enable 'Validation Layers' in the browser (chrome://flags/#enable-webgpu-developer-features) and check for 'Resource in use' or 'Validation Error' in the console.",
    "date": "2026-03-29",
    "id": 1774747643,
    "type": "error"
});