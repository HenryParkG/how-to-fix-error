window.onPostDataLoaded({
    "title": "Fix WebGPU Command Queue Buffer Mapping Races",
    "slug": "webgpu-command-queue-buffer-mapping-races",
    "language": "TypeScript",
    "code": "WebGPU Buffer Mapping Race",
    "tags": [
        "TypeScript",
        "WebGPU",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In WebGPU, buffer mapping is an asynchronous operation required to read data computed by the GPU back into CPU memory. A validation error and race condition occur when <code>GPUBuffer.mapAsync()</code> is invoked while the GPU queue still has outstanding commands writing to, or reading from, that exact buffer. Because GPU command submissions are non-blocking on the CPU timeline, attempts to map the buffer immediately after submission fail instantly on the GPU timeline execution validation checks.</p>",
    "root_cause": "WebGPU requires that a GPUBuffer be in an 'unmapped' state when submitted to a GPUQueue. Calling mapAsync() before previous write/read commands complete on the GPU device causes a validation collision because the buffer's execution state changes concurrently.",
    "bad_code": "// Buggy: Calling mapAsync immediately after queue submission\ndevice.queue.submit([commandBuffer]);\n\nbuffer.mapAsync(GPUMapMode.READ).then(() => {\n  const arrayBuffer = buffer.getMappedRange();\n  console.log(new Float32Array(arrayBuffer));\n  buffer.unmap();\n});",
    "solution_desc": "Synchronize host-side CPU execution with the device queue timeline using <code>GPUQueue.onSubmittedWorkDone()</code>. This guarantees that all previously queued GPU operations complete before your code attempts to map the buffer back to host memory.",
    "good_code": "// Solved: Ensure queue work is fully done before mapping\ndevice.queue.submit([commandBuffer]);\n\n// Await GPU timeline completion\nawait device.queue.onSubmittedWorkDone();\n\n// Securely map the buffer now that GPU is idle\nawait buffer.mapAsync(GPUMapMode.READ);\n\nconst arrayBuffer = buffer.getMappedRange();\nconst results = new Float32Array(arrayBuffer.slice(0)); // Clone the buffer safely\nbuffer.unmap();\n\nconsole.log(results);",
    "verification": "Run the application with WebGPU validation layers enabled. Confirm that no GPUValidationError is emitted in the browser dev tools console and verify the logged floating-point array contains correct computed output.",
    "date": "2026-07-12",
    "id": 1783843258,
    "type": "error"
});