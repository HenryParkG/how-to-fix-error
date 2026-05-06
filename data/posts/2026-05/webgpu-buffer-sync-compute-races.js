window.onPostDataLoaded({
    "title": "Resolve WebGPU Buffer Sync Races in Compute Pipelines",
    "slug": "webgpu-buffer-sync-compute-races",
    "language": "TypeScript",
    "code": "GPUSyncRace",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU offers explicit control over GPU synchronization, which is more powerful but error-prone compared to WebGL. A common issue arises in concurrent compute pipelines when multiple 'dispatchWorkgroups' calls read from and write to the same 'GPUBuffer' without proper memory barriers. Since commands are submitted to the queue in batches, the developer might assume sequential execution, but the GPU may overlap these operations if the internal resource state transitions aren't managed correctly within the command encoder.</p>",
    "root_cause": "Missing storage buffer synchronization between successive compute passes that depend on the same memory region, leading to read-after-write (RAW) hazards.",
    "bad_code": "const encoder = device.createCommandEncoder();\nconst pass1 = encoder.beginComputePass();\npass1.setPipeline(pipelineA);\npass1.dispatchWorkgroups(64);\npass1.end();\n\nconst pass2 = encoder.beginComputePass();\npass2.setPipeline(pipelineB); // Reads pipelineA output\npass2.dispatchWorkgroups(64);\npass2.end();\ndevice.queue.submit([encoder.finish()]);",
    "solution_desc": "While WebGPU handles most transitions automatically, ensure that dependencies are clear by using a single compute pass if possible, or by ensuring the buffer usage flags (STORAGE | COPY_SRC) correctly trigger the driver's internal barriers. If using multiple queues, explicit 'onSubmittedWorkDone' promises are required.",
    "good_code": "const encoder = device.createCommandEncoder();\n// Use a single compute pass to ensure the driver handles dependencies\nconst pass = encoder.beginComputePass();\npass.setPipeline(pipelineA);\npass.dispatchWorkgroups(64);\n// Add a placeholder or ensure pipelineB is in the same pass if resources overlap\npass.setPipeline(pipelineB);\npass.dispatchWorkgroups(64);\npass.end();\ndevice.queue.submit([encoder.finish()]);",
    "verification": "Enable 'Validation Layers' in the browser or via the '--enable-dawn-features=dump_shaders' flag in Chrome to check for resource contention warnings.",
    "date": "2026-05-06",
    "id": 1778054924,
    "type": "error"
});