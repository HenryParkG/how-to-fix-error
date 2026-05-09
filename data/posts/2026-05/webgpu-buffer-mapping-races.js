window.onPostDataLoaded({
    "title": "Fixing WebGPU Buffer Mapping Race Conditions",
    "slug": "webgpu-buffer-mapping-races",
    "language": "TypeScript",
    "code": "GPU_BUFFER_ERR",
    "tags": [
        "WebGPU",
        "Graphics",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU operates asynchronously. A common error in compute-heavy pipelines is attempting to map a GPU buffer back to CPU memory (via <code>mapAsync</code>) before the GPU has finished writing to it or while it is still bound to an active command encoder. This leads to validation errors or, worse, stale data reads because the mapping promise resolves while the GPU pipeline is still executing.</p>",
    "root_cause": "The root cause is a violation of the WebGPU state machine: a buffer cannot be mapped for CPU access while its state is 'managed by the GPU' (i.e., submitted in a command buffer that hasn't finished).",
    "bad_code": "device.queue.submit([commandEncoder.finish()]);\n// Error: Attempting to map immediately after submission\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange();",
    "solution_desc": "Architect the pipeline to use the <code>onSubmittedWorkDone()</code> promise or ensure that <code>mapAsync</code> is properly sequenced. A better pattern is to use a dedicated staging buffer and only initiate mapping after verifying all previous queue work is complete.",
    "good_code": "device.queue.submit([commandEncoder.finish()]);\n// Wait for the GPU to finish the work first\nawait device.queue.onSubmittedWorkDone();\nawait buffer.mapAsync(GPUMapMode.READ);\nconst data = buffer.getMappedRange().slice(0);\nbuffer.unmap();",
    "verification": "Check the browser console for 'Buffer is not in the mappable state' errors and ensure the WebGPU inspector shows the buffer state transitioning to 'mapped' only after submission completion.",
    "date": "2026-05-09",
    "id": 1778312611,
    "type": "error"
});