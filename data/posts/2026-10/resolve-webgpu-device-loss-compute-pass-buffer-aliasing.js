window.onPostDataLoaded({
    "title": "Resolve WebGPU Device Loss from Buffer Aliasing",
    "slug": "resolve-webgpu-device-loss-compute-pass-buffer-aliasing",
    "language": "TypeScript",
    "code": "GPUDeviceLost",
    "tags": [
        "TypeScript",
        "Next.js",
        "WebGPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU enforces strict memory hazard rules during command encoding. A common cause of silent GPU device loss (<code>GPUDeviceLostInfo</code> with reason 'destroyed' or 'unknown') is aliasing a single <code>GPUBuffer</code> across incompatible binding entries within the same compute pass.</p><p>When a compute shader reads and writes to overlapping regions of the same storage buffer across concurrent workgroups without split compute passes or without proper read-write storage declarations, the underlying hardware driver (Vulkan, Metal, or Direct3D 12) triggers validation panics or GPU page faults. WebGPU catches unauthorized hazard states by invalidating the logical device entirely to prevent data corruption and security breaches.</p>",
    "root_cause": "Binding the same buffer simultaneously as a read-only storage buffer and a read-write storage buffer within a single compute pass, or invoking concurrent dispatches that mutate aliased memory regions without pipeline barriers.",
    "bad_code": "const bindGroupLayout = device.createBindGroupLayout({\n  entries: [\n    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },\n    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },\n  ],\n});\n\n// Error: Same buffer bound to both read-only and write storage\nconst bindGroup = device.createBindGroup({\n  layout: bindGroupLayout,\n  entries: [\n    { binding: 0, resource: { buffer: sharedBuffer } },\n    { binding: 1, resource: { buffer: sharedBuffer } },\n  ],\n});\n\nconst pass = encoder.beginComputePass();\npass.setPipeline(pipeline);\npass.setBindGroup(0, bindGroup);\npass.dispatchWorkgroups(64);\npass.end();",
    "solution_desc": "Architect a double-buffering (ping-pong) strategy or declare the buffer explicitly as a single read-write storage buffer inside the WGSL shader. Ensure that successive operations reading previous outputs are split across distinct compute passes with separate command encoder dispatch barriers.",
    "good_code": "const computeLayout = device.createBindGroupLayout({\n  entries: [\n    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },\n  ],\n});\n\n// Dedicated Ping and Pong buffers to prevent read/write aliasing\nconst pingGroup = device.createBindGroup({\n  layout: computeLayout,\n  entries: [{ binding: 0, resource: { buffer: bufferSource } }],\n});\n\nconst pongGroup = device.createBindGroup({\n  layout: computeLayout,\n  entries: [{ binding: 0, resource: { buffer: bufferDestination } }],\n});\n\nconst pass = encoder.beginComputePass();\npass.setPipeline(computePipeline);\npass.setBindGroup(0, pingGroup);\npass.dispatchWorkgroups(64);\npass.end();\n\n// Subsequent operations execute in a new pass after synchronization\ndevice.queue.submit([encoder.finish()]);",
    "verification": "Register a device loss callback using `device.lost.then(...)`. Run stress dispatches under Chrome with `--enable-dawn-features=dump_shaders,use_user_defined_labels_in_backend` and verify no validation errors or device loss events occur.",
    "date": "2026-10-25",
    "id": 1792894931,
    "type": "error"
});