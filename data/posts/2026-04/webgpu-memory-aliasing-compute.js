window.onPostDataLoaded({
    "title": "Mitigating WebGPU Memory Aliasing in Compute Passes",
    "slug": "webgpu-memory-aliasing-compute",
    "language": "TypeScript",
    "code": "DataRace",
    "tags": [
        "TypeScript",
        "Next.js",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In WebGPU, memory aliasing occurs when multiple compute shader dispatches within the same command buffer write to the same buffer region without an execution dependency. Unlike WebGL, WebGPU grants more control over synchronization, but this also means the driver won't automatically prevent data races between two <code>dispatchWorkgroups</code> calls if they share storage buffers. This results in flickering artifacts or corrupted calculation results in complex simulations.</p>",
    "root_cause": "WebGPU compute passes do not implicitly synchronize between dispatches. If Dispatch A writes to a buffer and Dispatch B reads from it, there is no guarantee Dispatch A has finished unless they are in separate passes or use a pipeline barrier.",
    "bad_code": "const pass = encoder.beginComputePass();\npass.setPipeline(pipelineA);\npass.dispatchWorkgroups(64);\npass.setPipeline(pipelineB); // Reads what A writes\npass.dispatchWorkgroups(64);\npass.end();",
    "solution_desc": "The most robust fix is to split the dispatches into separate compute passes. <code>end()</code> and <code>beginComputePass()</code> on the same command encoder create an implicit memory barrier, ensuring all writes from the first pass are visible to the second.",
    "good_code": "const pass1 = encoder.beginComputePass();\npass1.setPipeline(pipelineA);\npass1.dispatchWorkgroups(64);\npass1.end();\n\nconst pass2 = encoder.beginComputePass();\npass2.setPipeline(pipelineB);\npass2.dispatchWorkgroups(64);\npass2.end();",
    "verification": "Use the 'WebGPU Inspector' extension to check for resource hazards and verify that the output buffer contents are deterministic across 100 iterations.",
    "date": "2026-04-17",
    "id": 1776420381,
    "type": "error"
});