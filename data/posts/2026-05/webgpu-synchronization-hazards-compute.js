window.onPostDataLoaded({
    "title": "Resolving WebGPU Synchronization Hazards in Compute Pipelines",
    "slug": "webgpu-synchronization-hazards-compute",
    "language": "TypeScript",
    "code": "SyncHazard",
    "tags": [
        "TypeScript",
        "React",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU requires explicit synchronization when multiple compute passes read and write to the same GPUBuffer. A synchronization hazard occurs when a subsequent dispatch starts reading from a buffer before the previous write dispatch has finished flushing its results to global memory. Unlike WebGL, WebGPU does not automatically insert barriers between dispatches within the same pass, leading to non-deterministic 'flickering' or corrupted data.</p>",
    "root_cause": "Missing execution and memory barriers between back-to-back compute dispatches that share a mutable storage buffer in the same command sequence.",
    "bad_code": "const commandEncoder = device.createCommandEncoder();\nconst pass = commandEncoder.beginComputePass();\npass.setPipeline(pipelineA);\npass.dispatchWorkgroups(64);\n// Hazard: pipelineB starts before pipelineA writes are visible\npass.setPipeline(pipelineB);\npass.dispatchWorkgroups(64);\npass.end();",
    "solution_desc": "Insert a storageBarrier() in the WGSL shader code or, more robustly, split the dispatches into separate compute passes or use explicit buffer usage transitions to ensure the driver inserts the necessary hardware fences.",
    "good_code": "const commandEncoder = device.createCommandEncoder();\nconst pass1 = commandEncoder.beginComputePass();\npass1.setPipeline(pipelineA);\npass1.dispatchWorkgroups(64);\npass1.end(); \n\n// Ending the pass ensures a transition/barrier\nconst pass2 = commandEncoder.beginComputePass();\npass2.setPipeline(pipelineB);\npass2.dispatchWorkgroups(64);\npass2.end();",
    "verification": "Use the 'WebGPU Inspector' or Chrome's validation layer. If no 'Read-after-Write' warnings appear and output is deterministic, the hazard is resolved.",
    "date": "2026-05-01",
    "id": 1777615207,
    "type": "error"
});