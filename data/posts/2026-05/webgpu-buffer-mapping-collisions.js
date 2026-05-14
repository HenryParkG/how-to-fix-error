window.onPostDataLoaded({
    "title": "Debugging WebGPU Buffer Mapping Collisions",
    "slug": "webgpu-buffer-mapping-collisions",
    "language": "TypeScript",
    "code": "OperationError",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU buffers cannot be accessed by the CPU and GPU simultaneously. A common error occurs when developers attempt to call <code>mapAsync</code> on a buffer that is currently 'in flight'\u2014meaning it has been submitted to a command queue but the GPU hasn't finished processing it. This results in a validation error because the buffer state is locked for GPU usage.</p>",
    "root_cause": "Invoking `buffer.mapAsync()` on a GPUBuffer while its state is not 'unmapped', usually because a prior GPU command using that buffer hasn't completed.",
    "bad_code": "device.queue.submit([commandEncoder.finish()]);\n// Error: Buffer is currently in use by the GPU\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange();",
    "solution_desc": "Use `device.queue.onSubmittedWorkDone()` to ensure the GPU has finished all previous commands before attempting to map the buffer, or use a staging buffer pattern where data is copied to a separate buffer dedicated for mapping.",
    "good_code": "device.queue.submit([commandEncoder.finish()]);\n\n// Wait for GPU to finish work\nawait device.queue.onSubmittedWorkDone();\n\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange().slice(0);\nbuffer.unmap();",
    "verification": "Check the browser's developer console for WebGPU validation errors. The fix is verified when `mapAsync` resolves without an 'OperationError'.",
    "date": "2026-05-14",
    "id": 1778756986,
    "type": "error"
});