window.onPostDataLoaded({
    "title": "Resolving WebGPU Pipeline Stalls in Multi-Queue Workflows",
    "slug": "webgpu-pipeline-stalls-resource-contention",
    "language": "TypeScript",
    "code": "PipelineStall",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU performance can degrade sharply when multiple command buffers or queues contend for the same GPU resources. Pipeline stalls occur when the GPU driver must insert synchronization barriers because a resource (like a storage buffer) is being written to by one pass while being read by another without clear async boundaries.</p>",
    "root_cause": "Submitting multiple work batches that have implicit dependencies on the same GPUBuffer without using async fences or proper staging buffer separation.",
    "bad_code": "device.queue.writeBuffer(dataBuffer, 0, newData);\ndevice.queue.submit([computeCommandBuffer]); // Blocked until write completes\ndevice.queue.submit([renderCommandBuffer]);  // Blocked by compute pass",
    "solution_desc": "Implement a 'Double Buffering' or 'Staging' pattern for resources and use onSubmittedWorkDone() to orchestrate CPU-GPU synchronization without blocking the main thread.",
    "good_code": "// Use staging buffers to avoid direct contention\ndevice.queue.writeBuffer(stagingBuffer, 0, newData);\ncommandEncoder.copyBufferToBuffer(stagingBuffer, 0, dataBuffer, 0, size);\nconst cb = commandEncoder.finish();\ndevice.queue.submit([cb]);\n\nawait device.queue.onSubmittedWorkDone();\n// Resource is now safe to reuse",
    "verification": "Use Chrome DevTools 'WebGPU' trace and look for long 'Queue Wait' intervals in the timeline.",
    "date": "2026-04-25",
    "id": 1777080494,
    "type": "error"
});