window.onPostDataLoaded({
    "title": "Mitigating WebGPU Buffer Map Contention",
    "slug": "webgpu-buffer-map-contention-visualization",
    "language": "TypeScript",
    "code": "GPU_BUFFER_MAP_ERROR",
    "tags": [
        "TypeScript",
        "Frontend",
        "Next.js",
        "Error Fix"
    ],
    "analysis": "<p>Real-time visualizations using WebGPU often require frequent data transfers between the CPU and GPU. Developers frequently hit errors where 'buffer is not in the unmapped state' when calling mapAsync. This contention happens because the CPU attempts to write to a buffer while the GPU is still executing a command buffer that references it, or because multiple map requests are queued simultaneously.</p>",
    "root_cause": "Attempting to map a GPUBuffer for CPU access before the GPU has finished executing previous commands that use that buffer, or failing to unmap before the next draw call.",
    "bad_code": "async function updateBuffer(data: Float32Array) {\n    await buffer.mapAsync(GPUMapMode.WRITE);\n    new Float32Array(buffer.getMappedRange()).set(data);\n    buffer.unmap();\n    // Error: mapAsync called while buffer is in 'mapping' state\n}",
    "solution_desc": "Implement a staging buffer ring or 'double buffering'. Write data to a separate 'MAP_WRITE' buffer, then use 'copyBufferToBuffer' to move data to the 'GPU_READ' buffer. This decouples CPU writes from GPU execution.",
    "good_code": "const stagingBuffer = device.createBuffer({\n    size: dataSize, usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC\n});\nasync function update() {\n    await stagingBuffer.mapAsync(GPUMapMode.WRITE);\n    new Float32Array(stagingBuffer.getMappedRange()).set(data);\n    stagingBuffer.unmap();\n\n    const commandEncoder = device.createCommandEncoder();\n    commandEncoder.copyBufferToBuffer(stagingBuffer, 0, gpuBuffer, 0, dataSize);\n    device.queue.submit([commandEncoder.finish()]);\n}",
    "verification": "Use Chrome DevTools 'WebGPU' tab to monitor buffer states and ensure 'Validation Errors' count remains zero during high-frequency updates.",
    "date": "2026-02-21",
    "id": 1771647835,
    "type": "error"
});