window.onPostDataLoaded({
    "title": "Fixing WebGPU Buffer Mapping Stalls",
    "slug": "webgpu-buffer-alignment-stalls",
    "language": "TypeScript",
    "code": "BufferStall",
    "tags": [
        "TypeScript",
        "Frontend",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU developers often encounter 'Mapping Stalls' or validation errors when trying to read back data from the GPU. This typically happens because buffers used for Uniforms or Storage have strict alignment requirements (multiples of 256 bytes) or because <code>mapAsync</code> is called on a buffer that is still being utilized by a submitted command encoder.</p><p>Synchronizing the CPU and GPU timeline is critical; the GPU must finish its work before the CPU can gain read access to the buffer memory.</p>",
    "root_cause": "Violating the 256-byte alignment rule for dynamic offsets or calling mapAsync without waiting for GPU work completion via device.queue.onSubmittedWorkDone.",
    "bad_code": "const buffer = device.createBuffer({\n    size: 100, // Error: Not aligned for some use cases\n    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_READ\n});\n\npassEncoder.end();\ndevice.queue.submit([commandEncoder.finish()]);\nawait buffer.mapAsync(GPUMapMode.READ); // Potential race condition/stall",
    "solution_desc": "Ensure buffer sizes are padded to multiples of 256 bytes and use 'onSubmittedWorkDone' to ensure the GPU has finished writing before initiating a read mapping.",
    "good_code": "const alignedSize = Math.ceil(100 / 256) * 256;\nconst buffer = device.createBuffer({\n    size: alignedSize,\n    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_READ\n});\n\n// ... submit work ...\ndevice.queue.submit([commandEncoder.finish()]);\n\nawait device.queue.onSubmittedWorkDone(); // Wait for GPU\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange().slice(0);",
    "verification": "Check the browser's developer console for WebGPU validation errors. Use 'GPU Synchronization' markers in Chrome's performance tab to confirm no CPU stalling.",
    "date": "2026-05-19",
    "id": 1779172953,
    "type": "error"
});