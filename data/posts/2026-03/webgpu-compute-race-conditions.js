window.onPostDataLoaded({
    "title": "Fixing WebGPU Resource Race Conditions in Multi-Pass Shaders",
    "slug": "webgpu-compute-race-conditions",
    "language": "TypeScript / WGSL",
    "code": "Data Race",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebGPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU compute shaders executing in multiple passes often suffer from Read-After-Write (RAW) hazards. When one pass writes to a storage buffer and the subsequent pass reads from it, the GPU scheduler may begin the second pass before the first has completed its writes to global memory. Unlike WebGL, WebGPU requires explicit synchronization or the use of command encoder boundaries to ensure data consistency across dispatch calls.</p>",
    "root_cause": "The issue arises when multiple dispatch calls are recorded in the same compute pass without an internal storage barrier, or when buffers are reused across passes without proper usage flags and pipeline barriers being inferred by the API.",
    "bad_code": "// Shaders running in the same pass without synchronization\nconst pass = commandEncoder.beginComputePass();\npass.setPipeline(pipelineA);\npass.dispatchWorkgroups(64);\n// Pass B starts immediately, potentially reading stale data from Buffer X\npass.setPipeline(pipelineB);\npass.dispatchWorkgroups(64);\npass.end();",
    "solution_desc": "Architecturally, split the operations into distinct compute passes or use the `storageBarrier()` function within the WGSL shader if the work occurs within the same dispatch. For cross-dispatch synchronization within the same pass, ensure the buffer is marked with `GPUBufferUsage.STORAGE` and consider if a pipeline barrier is required via separate passes.",
    "good_code": "// Solution 1: Separate passes ensure a synchronization point\nconst passA = commandEncoder.beginComputePass();\npassA.setPipeline(pipelineA);\npassA.dispatchWorkgroups(64);\npassA.end();\n\nconst passB = commandEncoder.beginComputePass();\npassB.setPipeline(pipelineB);\npassB.dispatchWorkgroups(64);\npassB.end();\n\n// Inside WGSL (if within one dispatch):\n// workgroupBarrier();\n// storageBarrier();",
    "verification": "Use the WebGPU Inspector extension to check for validation errors and use timestamp queries to ensure pass B execution time starts after pass A.",
    "date": "2026-03-07",
    "id": 1772857120,
    "type": "error"
});