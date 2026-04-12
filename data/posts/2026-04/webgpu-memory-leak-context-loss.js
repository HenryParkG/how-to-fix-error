window.onPostDataLoaded({
    "title": "Optimizing WebGPU Memory to Prevent Context Loss",
    "slug": "webgpu-memory-leak-context-loss",
    "language": "TypeScript",
    "code": "GPU_DEVICE_LOST",
    "tags": [
        "TypeScript",
        "React",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU is more explicit than WebGL, but it doesn't automatically garbage collect GPU-side resources like buffers and textures. If a developer creates resources inside a render loop or doesn't release them when a component unmounts, the browser's GPU process will eventually hit its memory ceiling. When this happens, the browser kills the entire GPU context\u2014not just for your app, but potentially for all tabs\u2014resulting in a 'Device Lost' error that is difficult to recover from without a page refresh.</p>",
    "root_cause": "Orphaned GPUBuffer and GPUTexture objects accumulating in VRAM due to missing .destroy() calls, leading to browser-wide resource exhaustion.",
    "bad_code": "function render() {\n  const buffer = device.createBuffer({ size: 1024, usage: GPUBufferUsage.UNIFORM });\n  // ... use buffer in bind group\n  device.queue.submit([commandEncoder.finish()]);\n  requestAnimationFrame(render); // Buffer is never destroyed!\n}",
    "solution_desc": "Implement a strict lifecycle management pattern where every 'create' call has a corresponding 'destroy' call. For frequently changing data, use a persistent buffer and update it via 'device.queue.writeBuffer' instead of creating new ones. Additionally, listen for the 'device.lost' promise to handle graceful degradation.",
    "good_code": "const persistentBuffer = device.createBuffer({ size: 1024, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });\n\nfunction render() {\n  const data = new Float32Array([Math.random()]);\n  device.queue.writeBuffer(persistentBuffer, 0, data);\n  // ... reuse the same buffer\n  requestAnimationFrame(render);\n}\n\n// On Cleanup:\npersistentBuffer.destroy();",
    "verification": "Use Chrome's Task Manager (Shift+Esc) to monitor 'GPU Memory' usage; it should remain stable during long-running sessions.",
    "date": "2026-04-12",
    "id": 1775977547,
    "type": "error"
});