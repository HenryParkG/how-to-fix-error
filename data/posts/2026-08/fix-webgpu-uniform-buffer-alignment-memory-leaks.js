window.onPostDataLoaded({
    "title": "Fix WebGPU Uniform Buffer Alignment and Memory Leaks",
    "slug": "fix-webgpu-uniform-buffer-alignment-memory-leaks",
    "language": "TypeScript",
    "code": "ValidationError",
    "tags": [
        "WebGPU",
        "Graphics",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>Multi-pass render graphs in WebGPU frequently update render dynamic uniform dynamic buffers frame by frame. Misunderstanding the required 256-byte offset alignment for dynamic uniform buffers triggers validation errors, while allocating GPUBuffer instances in frame render loops without pooling or explicit destruction quickly exhausts host and GPU memory.</p>",
    "root_cause": "Dynamic uniform buffer offsets must strictly align to device.limits.minUniformBufferOffsetAlignment (typically 256 bytes). Unaligned byte calculations cause render pass execution failures. Additionally, raw device.createBuffer calls inside render functions leak browser VRAM without explicit buffer cleanup.",
    "bad_code": "// Bug 1: Unaligned offset math (64 bytes matrix instead of 256 aligned)\nconst passOffset = passIndex * 64; \nrenderPass.setBindGroup(0, bindGroup, [passOffset]);\n\n// Bug 2: Creating un-pooled buffers in render loop without destroy()\nfunction renderLoop() {\n  const buf = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM });\n  // ... bind and draw\n}",
    "solution_desc": "Calculate dynamic dynamic offsets using dynamic alignment stride functions (rounded up to minUniformBufferOffsetAlignment) and implement persistent recycled GPUBuffer pools or dynamic ring buffers.",
    "good_code": "const ALIGNMENT = device.limits.minUniformBufferOffsetAlignment; // 256\nfunction getAlignedSize(byteSize: number): number {\n  return Math.ceil(byteSize / ALIGNMENT) * ALIGNMENT;\n}\n\nconst stride = getAlignedSize(64);\nconst passOffset = passIndex * stride;\nrenderPass.setBindGroup(0, bindGroup, [passOffset]);\n\n// Persistent buffer reuse pattern\nclass BufferPool {\n  private freeBuffers: GPUBuffer[] = [];\n  get(device: GPUDevice, size: number): GPUBuffer {\n    return this.freeBuffers.pop() || device.createBuffer({\n      size: getAlignedSize(size),\n      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\n    });\n  }\n  release(buf: GPUBuffer) { this.freeBuffers.push(buf); }\n}",
    "verification": "Inspect browser WebGPU console log output to confirm zero validation errors, and check memory allocation metrics in DevTools to ensure VRAM stays stable during multi-pass rendering.",
    "date": "2026-08-07",
    "id": 1786096319,
    "type": "error"
});