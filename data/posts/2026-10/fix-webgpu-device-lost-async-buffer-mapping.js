window.onPostDataLoaded({
    "title": "Fix WebGPU Device Lost from Async Buffer Mapping",
    "slug": "fix-webgpu-device-lost-async-buffer-mapping",
    "language": "TypeScript",
    "code": "GPUValidationError",
    "tags": [
        "TypeScript",
        "Frontend",
        "Next.js",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU strictly decouples GPU-side asynchronous execution from CPU memory mapping. A frequent cause of catastrophic <code>GPUDevice.lost</code> errors is attempting to call <code>mapAsync()</code> on a <code>GPUBuffer</code> while queued GPU commands referencing that buffer are still in flight, or modifying buffers without waiting for queue retirement.</p><p>Unlike WebGL which concealed state hazards behind blocking driver calls, WebGPU transitions a buffer into a locked state upon mapping. If a shader pass or internal transfer attempts to read/write a buffer whose state is currently transitioning or already mapped, the browser's WebGPU validation layer flags an unrecoverable synchronization violation and instantly crashes the entire virtual device context.</p>",
    "root_cause": "Race condition caused by invoking GPUBuffer.mapAsync() before prior command buffers have finished executing on the GPU queue, or submitting new commands while the buffer remains mapped without an unmap() call.",
    "bad_code": "async function readBufferDirectly(device: GPUDevice, storageBuffer: GPUBuffer, size: number) {\n  const stagingBuffer = device.createBuffer({\n    size,\n    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,\n  });\n\n  const encoder = device.createCommandEncoder();\n  encoder.copyBufferToBuffer(storageBuffer, 0, stagingBuffer, 0, size);\n  device.queue.submit([encoder.finish()]);\n\n  // BUG: mapAsync called immediately without awaiting queue work completion\n  // Leads to device loss if previous operations are still executing\n  await stagingBuffer.mapAsync(GPUMapMode.READ, 0, size);\n  const data = new Float32Array(stagingBuffer.getMappedRange(0, size).slice(0));\n  // Missing stagingBuffer.unmap() before function exit\n  return data;\n}",
    "solution_desc": "Explicitly await device.queue.onSubmittedWorkDone() before mapping memory, extract data using a detached ArrayBuffer copy, ensure unmap() is invoked unconditionally inside a try...finally block, and properly destroy temporary staging buffers.",
    "good_code": "async function readBufferSafely(device: GPUDevice, storageBuffer: GPUBuffer, size: number): Promise<Float32Array> {\n  const stagingBuffer = device.createBuffer({\n    size,\n    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,\n  });\n\n  const encoder = device.createCommandEncoder();\n  encoder.copyBufferToBuffer(storageBuffer, 0, stagingBuffer, 0, size);\n  device.queue.submit([encoder.finish()]);\n\n  // Synchronize CPU with GPU queue retirement before mapping\n  await device.queue.onSubmittedWorkDone();\n  await stagingBuffer.mapAsync(GPUMapMode.READ, 0, size);\n\n  try {\n    const mappedRange = stagingBuffer.getMappedRange(0, size);\n    // Create an independent copy before unmapping\n    const result = new Float32Array(mappedRange.slice(0));\n    return result;\n  } finally {\n    stagingBuffer.unmap();\n    stagingBuffer.destroy();\n  }\n}",
    "verification": "Register a device.lost handler to catch unexpected crashes, execute 5,000 continuous readback iterations under load, and verify that chrome://gpu reports zero GPU device reset occurrences.",
    "date": "2026-10-23",
    "id": 1792722982,
    "type": "error"
});