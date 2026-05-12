window.onPostDataLoaded({
    "title": "Resolving WebGPU Pipeline Stalls in Compute Shaders",
    "slug": "webgpu-command-buffer-pipeline-stalls",
    "language": "TypeScript",
    "code": "GPUPipelineStall",
    "tags": [
        "TypeScript",
        "WebGPU",
        "Performance",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU applications often experience frame drops or latency spikes when submitting high-frequency compute workloads. This is usually caused by 'pipeline stalls' where the GPU is waiting for commands to be processed or synchronized.</p><p>The overhead of calling <code>device.queue.submit()</code> for every small compute operation creates a bottleneck in the command submission path, preventing the GPU from achieving full occupancy.</p>",
    "root_cause": "Excessive granularity in command buffer submission and improper use of mapAsync() which blocks the execution of subsequent GPU commands.",
    "bad_code": "for (let i = 0; i < 1000; i++) {\n    const commandEncoder = device.createCommandEncoder();\n    const passEncoder = commandEncoder.beginComputePass();\n    passEncoder.setPipeline(pipeline);\n    passEncoder.dispatchWorkgroups(1);\n    passEncoder.end();\n    // WRONG: Submitting in a loop creates massive overhead\n    device.queue.submit([commandEncoder.finish()]);\n}",
    "solution_desc": "Batch compute operations into a single command encoder and submit them as a single command buffer. Use storage buffers efficiently and avoid read-backs (mapAsync) during high-frequency dispatch cycles.",
    "good_code": "const commandEncoder = device.createCommandEncoder();\nconst passEncoder = commandEncoder.beginComputePass();\npassEncoder.setPipeline(pipeline);\n\nfor (let i = 0; i < 1000; i++) {\n    // Batching dispatches into one pass\n    passEncoder.setBindGroup(0, bindGroups[i]);\n    passEncoder.dispatchWorkgroups(1);\n}\npassEncoder.end();\n\n// CORRECT: Single submission for the entire batch\ndevice.queue.submit([commandEncoder.finish()]);",
    "verification": "Profile using Chrome's 'GPU' tracing or the WebGPU Inspector to ensure that the command timeline shows continuous GPU utilization rather than small, fragmented blocks.",
    "date": "2026-05-12",
    "id": 1778584397,
    "type": "error"
});