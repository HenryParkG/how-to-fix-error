window.onPostDataLoaded({
    "title": "WebGPU: BindGroup Aliasing Hazards & Pipeline Stalls",
    "slug": "webgpu-bindgroup-aliasing-pipeline-stalls",
    "language": "TypeScript",
    "code": "GPUValidationError",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In WebGPU, resource aliasing occurs when a compute or render pass binds the same <code>GPUBuffer</code> or <code>GPUTexture</code> simultaneously to read-only and read-write binding slots without explicit synchronization or distinct pass partitioning. Furthermore, synchronous pipeline creation blocks JavaScript execution while the GPU driver compiles shader modules, causing visible frame drops.</p>",
    "root_cause": "Binding overlapping storage buffer bindings with conflicting read/write usages within the same dispatch pass violates WebGPU usage invariants, while synchronous pipeline compilation halts main thread frame execution.",
    "bad_code": "export function setupComputePass(device: GPUDevice, buffer: GPUBuffer, shader: GPUShaderModule) {\n  // Anti-pattern: Synchronous compilation causes pipeline stalls\n  const pipeline = device.createComputePipeline({\n    layout: 'auto',\n    compute: { module: shader, entryPoint: 'main' }\n  });\n\n  // Anti-pattern: Same buffer bound as both read and read_write creates validation hazard\n  const bindGroup = device.createBindGroup({\n    layout: pipeline.getBindGroupLayout(0),\n    entries: [\n      { binding: 0, resource: { buffer: buffer } }, // read-only binding\n      { binding: 1, resource: { buffer: buffer } }  // read_write storage binding\n    ]\n  });\n  return { pipeline, bindGroup };\n}",
    "solution_desc": "Use `createComputePipelineAsync` to compile pipelines off-thread, and implement double-buffering (ping-pong buffers) with distinct input and output bindings per pass to avoid read-write resource aliasing.",
    "good_code": "export async function setupComputePassAsync(\n  device: GPUDevice,\n  inputBuffer: GPUBuffer,\n  outputBuffer: GPUBuffer,\n  shader: GPUShaderModule\n): Promise<{ pipeline: GPUComputePipeline; bindGroup: GPUBindGroup }> {\n  // Asynchronous pipeline initialization prevents UI frame stutter\n  const pipeline = await device.createComputePipelineAsync({\n    layout: 'auto',\n    compute: { module: shader, entryPoint: 'main' }\n  });\n\n  // Separate buffer references eliminate aliasing validation hazards\n  const bindGroup = device.createBindGroup({\n    layout: pipeline.getBindGroupLayout(0),\n    entries: [\n      { binding: 0, resource: { buffer: inputBuffer } },\n      { binding: 1, resource: { buffer: outputBuffer } }\n    ]\n  });\n\n  return { pipeline, bindGroup };\n}",
    "verification": "Wrap command submissions with `device.pushErrorScope('validation')` and verify that `await device.popErrorScope()` returns `null` while Chrome DevTools shows unblocked 60/120 FPS timeline metrics.",
    "date": "2026-08-31",
    "id": 1788167454,
    "type": "error"
});