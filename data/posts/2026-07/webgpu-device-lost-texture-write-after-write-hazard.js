window.onPostDataLoaded({
    "title": "Fix WebGPU Device Lost from Write-after-Write Hazard",
    "slug": "webgpu-device-lost-texture-write-after-write-hazard",
    "language": "TypeScript",
    "code": "GPUDeviceLostError",
    "tags": [
        "TypeScript",
        "WebGPU",
        "Graphics",
        "Error Fix"
    ],
    "analysis": "<p>In WebGPU, developers interact with hardware resources through commands submitted asynchronously to the <code>GPUQueue</code>. Unlike older APIs, WebGPU relies on aggressive driver-level validation and explicit pipeline barriers to prevent data races. A Write-after-Write (WAW) hazard occurs when multiple write operations are scheduled on the same texture subresource without adequate synchronization boundaries. When the WebGPU runtime detects an un-synchronized hazard where concurrent write commands could race, it instantly destroys the virtual GPU context to prevent driver corruption, resulting in a <code>GPUDeviceLostError</code>.</p>",
    "root_cause": "The driver encounters back-to-back writes on the same texture view within the same command buffer pass submission, violating the rule that texture states must be transitioned and synchronized between distinct write/read operations.",
    "bad_code": "async function writeTextureTwice(device: GPUDevice, texture: GPUTexture) {\n  const data1 = new Float32Array([1.0, 0.0, 0.0, 1.0]);\n  const data2 = new Float32Array([0.0, 1.0, 0.0, 1.0]);\n\n  // BAD: Issuing concurrent queue writes to the same subresource in the same tick\n  device.queue.writeTexture({ texture }, data1, {}, [1, 1]);\n  device.queue.writeTexture({ texture }, data2, {}, [1, 1]);\n}",
    "solution_desc": "To fix this, write events must be sequentialized and separated. For complex operations, use a temporary staging buffer, map writes sequentially, or separate write submissions using queue schedule fences or the `onSubmittedWorkDone` completion promise to guarantee the GPU has processed the first write before commencing the second.",
    "good_code": "async function writeTextureSequentially(device: GPUDevice, texture: GPUTexture) {\n  const data1 = new Float32Array([1.0, 0.0, 0.0, 1.0]);\n  const data2 = new Float32Array([0.0, 1.0, 0.0, 1.0]);\n\n  // Write the first set of texture coordinates\n  device.queue.writeTexture({ texture }, data1, {}, [1, 1]);\n  \n  // Wait for the WebGPU queue pipeline to clear execution barriers\n  await device.queue.onSubmittedWorkDone();\n\n  // Safely perform the second write operation\n  device.queue.writeTexture({ texture }, data2, {}, [1, 1]);\n}",
    "verification": "Compile and run with Chrome DevTools GPU flags enabled. Observe that the `device.lost` promise does not resolve, and console output remains free of WebGPU validation errors.",
    "date": "2026-07-05",
    "id": 1783249162,
    "type": "error"
});