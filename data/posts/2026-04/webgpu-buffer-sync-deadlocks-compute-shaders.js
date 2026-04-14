window.onPostDataLoaded({
    "title": "Debugging WebGPU Buffer Sync Deadlocks",
    "slug": "webgpu-buffer-sync-deadlocks-compute-shaders",
    "language": "WebGPU/TS",
    "code": "BufferSyncDeadlock",
    "tags": [
        "WebGPU",
        "Graphics",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU deadlocks occur in multi-pass compute pipelines when the CPU attempts to map a buffer for reading while the GPU still holds a lock on it for writing. Since <code>mapAsync</code> is non-blocking, the deadlock manifests as a permanent 'pending' state of the promise.</p>",
    "root_cause": "Attempting to call <code>buffer.mapAsync(GPUMapMode.READ)</code> before the command buffer that writes to it has fully completed execution on the GPU queue.",
    "bad_code": "device.queue.submit([commandEncoder.finish()]);\n// This promise might never resolve if the queue is blocked\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange();",
    "solution_desc": "Use <code>device.queue.onSubmittedWorkDone()</code> to ensure all GPU tasks are complete before requesting a CPU-side mapping.",
    "good_code": "device.queue.submit([commandEncoder.finish()]);\n// Wait for the GPU to finish all work before mapping\nawait device.queue.onSubmittedWorkDone();\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange().slice(0);",
    "verification": "Check Chrome's `about:gpu` log for 'Device Lost' or 'Mapping pending' warnings.",
    "date": "2026-04-14",
    "id": 1776131135,
    "type": "error"
});