window.onPostDataLoaded({
    "title": "Resolving WebGPU Buffer Mapping Race Conditions",
    "slug": "webgpu-buffer-mapping-race-conditions",
    "language": "TypeScript",
    "code": "GPUBufferUsageError",
    "tags": [
        "WebGPU",
        "Graphics",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>In multi-threaded compute pipelines using WebGPU, developers often encounter 'Buffer already mapped' or 'InvalidStateError' when trying to read results back to the CPU. This happens because buffer mapping is an asynchronous operation that requires strict ownership transfer between the GPU and CPU.</p><p>If a worker thread attempts to map a buffer while the GPU queue is still processing a command that references that buffer, the browser runtime will throw a validation error to prevent memory corruption.</p>",
    "root_cause": "Calling GPUBuffer.mapAsync() on a buffer that is currently in use by the GPU or already has a pending mapping request without proper synchronization via the device queue.",
    "bad_code": "async function readResults(buffer) {\n    device.queue.submit([commandEncoder.finish()]);\n    // Race condition: buffer is still in use by GPU\n    await buffer.mapAsync(GPUMapMode.READ);\n    const data = buffer.getMappedRange().slice();\n    buffer.unmap();\n}",
    "solution_desc": "Utilize 'device.queue.onSubmittedWorkDone()' to ensure all GPU operations are complete before initiating the mapping request. Additionally, implement a staging buffer pattern where data is copied from a private GPU buffer to a map-ready buffer.",
    "good_code": "async function readResults(buffer) {\n    device.queue.submit([commandEncoder.finish()]);\n    // Wait for the GPU to finish all submitted work\n    await device.queue.onSubmittedWorkDone();\n    \n    await buffer.mapAsync(GPUMapMode.READ);\n    const result = new Float32Array(buffer.getMappedRange());\n    const data = result.slice();\n    buffer.unmap();\n    return data;\n}",
    "verification": "Enable Chrome's 'unsafe-webgpu-disable-validation' flag temporarily to confirm the error is gone, then verify data integrity by comparing GPU output buffers against a CPU reference implementation.",
    "date": "2026-03-10",
    "id": 1773124688,
    "type": "error"
});