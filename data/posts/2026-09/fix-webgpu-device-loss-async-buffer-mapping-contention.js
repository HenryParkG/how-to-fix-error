window.onPostDataLoaded({
    "title": "Fixing WebGPU Device Loss from Buffer Mapping",
    "slug": "fix-webgpu-device-loss-async-buffer-mapping-contention",
    "language": "TypeScript",
    "code": "GPUDeviceLostInfo",
    "tags": [
        "TypeScript",
        "Frontend",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>In WebGPU, host-accessible data transfer requires memory mapping via <code>GPUBuffer.mapAsync()</code>. The WebGPU specification strictly dictates buffer states: a buffer can be either mapped or unmapped, and operations like <code>queue.submit()</code> require the buffer to be in the unmapped state.</p><p>When an application triggers multiple render or compute frames concurrently, race conditions occur if a subsequent frame requests readback on a buffer that has an active or pending <code>mapAsync()</code> operation. This contract breach causes a GPU validation failure, which in turn bubbles up into an unrecoverable <code>GPUDeviceLostInfo</code> exception.</p>",
    "root_cause": "Calling `GPUBuffer.mapAsync()` on an already mapped or active queue-referenced buffer before an explicit `unmap()`, triggering fatal validation device loss.",
    "bad_code": "async function readbackData(device: GPUDevice, stagingBuffer: GPUBuffer) {\n  // Bug: Called on every animation frame concurrently without status check\n  await stagingBuffer.mapAsync(GPUMapMode.READ);\n  const copy = stagingBuffer.getMappedRange().slice(0);\n  stagingBuffer.unmap();\n  return copy;\n}",
    "solution_desc": "Implement a staging buffer ring-pool pattern. Instead of reusing a single buffer across frames, lease ephemeral or ring-indexed buffers with explicit state tracking, ensuring `mapAsync()` is only called after queue fences confirm submission completion and no buffer is double-mapped.",
    "good_code": "class StagingBufferRing {\n  private pool: Array<{ buffer: GPUBuffer; inUse: boolean }> = [];\n  \n  constructor(private device: GPUDevice, private size: number, private capacity = 3) {\n    for (let i = 0; i < capacity; i++) {\n      this.pool.push({\n        buffer: device.createBuffer({\n          size,\n          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST\n        }),\n        inUse: false\n      });\n    }\n  }\n\n  async readback(commandEncoder: GPUCommandEncoder, sourceBuffer: GPUBuffer): Promise<ArrayBuffer> {\n    const entry = this.pool.find(e => !e.inUse);\n    if (!entry) throw new Error(\"Staging buffer pool exhausted\");\n    \n    entry.inUse = true;\n    commandEncoder.copyBufferToBuffer(sourceBuffer, 0, entry.buffer, 0, this.size);\n    \n    return new Promise((resolve, reject) => {\n      // Execute map only after queue work completes\n      this.device.queue.onSubmittedWorkDone().then(async () => {\n        try {\n          await entry.buffer.mapAsync(GPUMapMode.READ);\n          const data = entry.buffer.getMappedRange().slice(0);\n          entry.buffer.unmap();\n          entry.inUse = false;\n          resolve(data);\n        } catch (err) {\n          entry.inUse = false;\n          reject(err);\n        }\n      });\n    });\n  }\n}",
    "verification": "Attach a listener via `device.lost.then(...)` and run stress tests at 120 FPS. Verify that `device.lost` is never triggered and mapped ranges return valid payload slices.",
    "date": "2026-09-27",
    "id": 1790519121,
    "type": "error"
});