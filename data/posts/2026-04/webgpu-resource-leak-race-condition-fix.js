window.onPostDataLoaded({
    "title": "Fixing WebGPU Resource Leakage and Buffer Race Conditions",
    "slug": "webgpu-resource-leak-race-condition-fix",
    "language": "TypeScript",
    "code": "GPUResourceLeak",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU application performance often degrades due to improper lifecycle management of GPUBuffer and GPUTexture objects. Unlike JavaScript memory, VRAM is not automatically garbage collected in a timely manner. Furthermore, race conditions occur when a CPU-side read command (mapAsync) is issued before the GPU-side write command in the command queue has finished execution.</p>",
    "root_cause": "Failure to call .destroy() on temporary buffers and attempting to map buffers for reading without waiting for device.queue.onSubmittedWorkDone().",
    "bad_code": "const buffer = device.createBuffer({ size: 1024, usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_READ });\n// ... compute pass ...\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange();",
    "solution_desc": "Implement a strict lifecycle management pattern where buffers are explicitly destroyed when no longer needed, and use queue synchronization to ensure the GPU has finished writing before the CPU attempts to read.",
    "good_code": "const buffer = device.createBuffer({ size: 1024, usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_READ });\ntry {\n  device.queue.submit([commandEncoder.finish()]);\n  await device.queue.onSubmittedWorkDone();\n  await buffer.mapAsync(GPUMapMode.READ);\n  const data = buffer.getMappedRange().slice();\n  buffer.unmap();\n} finally {\n  buffer.destroy();\n}",
    "verification": "Use Chrome DevTools 'WebGPU' tab to monitor buffer count and VRAM allocation over time to ensure it remains constant.",
    "date": "2026-04-04",
    "id": 1775285402,
    "type": "error"
});