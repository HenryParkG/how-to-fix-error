window.onPostDataLoaded({
    "title": "Fixing WebGPU Uniform Buffer Alignment Faults",
    "slug": "fixing-webgpu-uniform-buffer-alignment-faults",
    "language": "TypeScript",
    "code": "AlignmentFault",
    "tags": [
        "WebGPU",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In WebGPU dynamic multi-pass compute pipelines, setting bind groups with dynamic uniform buffer offsets can trigger validation errors such as <code>Offset is not a multiple of minUniformBufferOffsetAlignment</code>. WebGPU mandates that explicit dynamic offsets passed to <code>setBindGroup</code> must align strictly with the GPU device's dynamic offset boundary requirements (typically 256 bytes).</p>",
    "root_cause": "Buffer byte offsets for dynamic uniform dynamic bindings were allocated matching unpadded struct sizes (e.g., 64 bytes) rather than rounding up to multiples of `device.limits.minUniformBufferOffsetAlignment`.",
    "bad_code": "const structSize = 64; // Size of uniform struct\nconst bufferSize = structSize * passCount;\nconst uniformBuffer = device.createBuffer({\n  size: bufferSize,\n  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,\n});\n\n// BAD: Dynamic offset 64 violates 256-byte alignment requirement\nfor (let pass = 0; pass < passCount; pass++) {\n  const dynamicOffset = pass * structSize;\n  passEncoder.setBindGroup(0, bindGroup, [dynamicOffset]);\n}",
    "solution_desc": "Calculate dynamic dynamic byte offsets by aligning struct byte bounds against `device.limits.minUniformBufferOffsetAlignment` using round-up padding routines.",
    "good_code": "const minAlignment = device.limits.minUniformBufferOffsetAlignment;\nconst unalignedSize = 64;\n// Round up size to dynamic alignment boundary (e.g., 256 bytes)\nconst alignedSize = Math.ceil(unalignedSize / minAlignment) * minAlignment;\n\nconst uniformBuffer = device.createBuffer({\n  size: alignedSize * passCount,\n  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,\n});\n\nfor (let pass = 0; pass < passCount; pass++) {\n  const dynamicOffset = pass * alignedSize;\n  passEncoder.setBindGroup(0, bindGroup, [dynamicOffset]);\n}",
    "verification": "Run the compute pipeline while watching browser developer tools console to ensure WebGPU validation errors regarding buffer offset alignments are completely cleared.",
    "date": "2026-07-25",
    "id": 1784965884,
    "type": "error"
});