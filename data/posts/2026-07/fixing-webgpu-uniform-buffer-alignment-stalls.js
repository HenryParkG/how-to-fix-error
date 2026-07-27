window.onPostDataLoaded({
    "title": "Fixing WebGPU Uniform Buffer Alignment Stalls",
    "slug": "fixing-webgpu-uniform-buffer-alignment-stalls",
    "language": "TypeScript",
    "code": "AlignmentError",
    "tags": [
        "WebGPU",
        "Graphics",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU strictly enforces buffer offset alignment rules. When executing dynamic compute pipelines, dynamic uniform offsets supplied in <code>setBindGroup</code> must align to integer multiples of <code>minUniformBufferOffsetAlignment</code> (commonly 256 bytes). If a application packs WGSL uniform structs without factoring in explicit padding requirements, the underlying GPU driver will cause execution pipeline validation failures, GPU stalls, or corrupt shader output due to misaligned memory reads.</p>",
    "root_cause": "Dynamic offsets passed to bind groups violate the 256-byte alignment requirement specified by the device limits.",
    "bad_code": "const offset = 64; // BUG: 64 bytes is not aligned to minUniformBufferOffsetAlignment (256)\nconst dynamicBindGroup = device.createBindGroup({\n  layout: bindGroupLayout,\n  entries: [{\n    binding: 0,\n    resource: {\n      buffer: uniformBuffer,\n      offset: offset, // Throws validation error or causes GPU stall\n      size: 64\n    }\n  }]\n});\n\npassEncoder.setBindGroup(0, dynamicBindGroup);",
    "solution_desc": "Query 'device.limits.minUniformBufferOffsetAlignment' dynamically, pad data arrays to meet alignment boundaries, and apply appropriate WGSL memory layout annotations.",
    "good_code": "const minAlignment = device.limits.minUniformBufferOffsetAlignment; // Typically 256\nconst structSize = 64;\n// Round up stride to nearest multiple of minAlignment\nconst alignedStride = Math.ceil(structSize / minAlignment) * minAlignment;\n\nconst offset = alignedStride * 1; // Correctly aligned offset\n\nconst dynamicBindGroup = device.createBindGroup({\n  layout: bindGroupLayout,\n  entries: [{\n    binding: 0,\n    resource: {\n      buffer: uniformBuffer,\n      offset: offset,\n      size: structSize\n    }\n  }]\n});\n\npassEncoder.setBindGroup(0, dynamicBindGroup);",
    "verification": "Enable browser WebGPU validation errors and confirm zero alignment error messages appear in the developer console during compute pipeline execution.",
    "date": "2026-07-27",
    "id": 1785154308,
    "type": "error"
});