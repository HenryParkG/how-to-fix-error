window.onPostDataLoaded({
    "title": "WebGPU: Fixing Sync Hazards in Compute Pass Barriers",
    "slug": "webgpu-compute-pass-synchronization-hazards",
    "language": "TypeScript",
    "code": "Race Condition",
    "tags": [
        "TypeScript",
        "Frontend",
        "Next.js",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU operates on an asynchronous command queue model. A synchronization hazard occurs when a storage buffer is modified in one Compute Pass and read in a subsequent operation without ensuring the GPU has completed the write. While WebGPU provides some automatic resource tracking, hazards specifically arise when using multiple <code>dispatchWorkgroups</code> calls within the same pass that depend on each other's output, or when crossing pass boundaries without declaring the appropriate usage transitions in the bind group layouts.</p>",
    "root_cause": "Implicit synchronization fails when a buffer is bound with 'read-write' storage usage across multiple dispatches that have data dependencies, without intermediate memory barriers or pipeline stalls.",
    "bad_code": "const pass = commandEncoder.beginComputePass();\npass.setPipeline(pipelineA);\npass.dispatchWorkgroups(64);\n// Hazard: pipelineB reads output from A immediately\npass.setPipeline(pipelineB);\npass.dispatchWorkgroups(64);\npass.end();",
    "solution_desc": "Split the operations into distinct compute passes or use storage textures with appropriate memory barriers. WebGPU guarantees that work within a single pass is finished before the next pass begins if there is a dependency in the command buffer sequence.",
    "good_code": "const pass1 = commandEncoder.beginComputePass();\npass1.setPipeline(pipelineA);\npass1.dispatchWorkgroups(64);\npass1.end(); \n\n// Ending the pass ensures writes are visible to the next pass\nconst pass2 = commandEncoder.beginComputePass();\npass2.setPipeline(pipelineB);\npass2.dispatchWorkgroups(64);\npass2.end();",
    "verification": "Use the 'WebGPU Inspector' extension or Chrome's 'GPU Internals'. Look for validation errors regarding Read-After-Write (RAW) hazards. Ensure data consistency in the final buffer readback.",
    "date": "2026-02-15",
    "id": 1771137629,
    "type": "error"
});