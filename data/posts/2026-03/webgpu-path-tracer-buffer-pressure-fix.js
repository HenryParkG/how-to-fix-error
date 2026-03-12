window.onPostDataLoaded({
    "title": "Mitigating WebGPU Buffer Pressure in Path Tracers",
    "slug": "webgpu-path-tracer-buffer-pressure-fix",
    "language": "TypeScript",
    "code": "GPUDeviceLost",
    "tags": [
        "TypeScript",
        "WebGPU",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Real-time path tracers in WebGPU often suffer from 'Buffer Pressure' where frequent updates to Bounding Volume Hierarchy (BVH) or material buffers saturate the GPU command queue. This leads to frame stuttering or 'Device Lost' errors because the browser's GPU process hits a timeout (TDR) while waiting for buffer uploads to finish.</p>",
    "root_cause": "Creating new buffers per frame (GC pressure) and using 'writeBuffer' for large datasets instead of staging buffers and 'copyBufferToBuffer'.",
    "bad_code": "function frame() {\n    // BAD: Creating new buffers every frame kills performance\n    const buffer = device.createBuffer({ size: data.length, usage: GPUBufferUsage.STORAGE });\n    device.queue.writeBuffer(buffer, 0, data);\n    // ... render pass\n}",
    "solution_desc": "Implement a 'Staging Belt' or 'Ring Buffer' pattern. Create a large, persistent buffer with MAP_WRITE usage and copy data to the GPU-only storage buffer using 'copyBufferToBuffer' to allow the CPU and GPU to work in parallel without blocking.",
    "good_code": "const storageBuffer = device.createBuffer({ size: MAX_SIZE, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });\nconst stagingBuffer = device.createBuffer({ size: MAX_SIZE, usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC });\n\nasync function updateBuffer(data: ArrayBuffer) {\n    await stagingBuffer.mapAsync(GPUMapMode.WRITE);\n    new Uint8Array(stagingBuffer.getMappedRange()).set(new Uint8Array(data));\n    stagingBuffer.unmap();\n    \n    const encoder = device.createCommandEncoder();\n    encoder.copyBufferToBuffer(stagingBuffer, 0, storageBuffer, 0, data.byteLength);\n    device.queue.submit([encoder.finish()]);\n}",
    "verification": "Use the Chrome 'WebGPU Inspector' to verify that buffer allocations are static and frame times are consistent.",
    "date": "2026-03-12",
    "id": 1773290573,
    "type": "error"
});