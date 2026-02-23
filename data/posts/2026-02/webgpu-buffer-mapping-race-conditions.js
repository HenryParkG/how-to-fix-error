window.onPostDataLoaded({
    "title": "Fixing WebGPU Buffer Mapping Race Conditions",
    "slug": "webgpu-buffer-mapping-race-conditions",
    "language": "TypeScript",
    "code": "BufferMappingError",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebGPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU enforces strict rules regarding buffer ownership. A buffer cannot be mapped for CPU access while it is 'in use' by the GPU. In multi-threaded rendering contexts (using Web Workers), race conditions occur when the CPU attempts to call <code>mapAsync()</code> on a buffer that has been submitted in a command encoder but hasn't finished execution on the GPU timeline.</p>",
    "root_cause": "Calling 'GPUBuffer.mapAsync(GPUMapMode.READ)' immediately after 'queue.submit()' without waiting for the GPU timeline to clear the buffer usage.",
    "bad_code": "device.queue.submit([commandEncoder.finish()]);\n// Error: Buffer is still in use by the GPU queue\nbuffer.mapAsync(GPUMapMode.READ).then(() => {\n    const data = buffer.getMappedRange();\n});",
    "solution_desc": "Use `device.queue.onSubmittedWorkDone()` to ensure all previous commands are processed before attempting to map the buffer, or implement a staging buffer pattern.",
    "good_code": "device.queue.submit([commandEncoder.finish()]);\n\n// Wait for GPU to finish work\nawait device.queue.onSubmittedWorkDone();\n\nawait buffer.mapAsync(GPUMapMode.READ);\nconst copyArray = new Float32Array(buffer.getMappedRange());\nconsole.log(copyArray);\nbuffer.unmap();",
    "verification": "Check the browser console for 'Buffer is not currently mappable' validation errors. Use Chrome's 'WebGPU Internals' to track buffer state transitions.",
    "date": "2026-02-23",
    "id": 1771839890,
    "type": "error"
});