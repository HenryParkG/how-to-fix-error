window.onPostDataLoaded({
    "title": "Fixing WebGPU Buffer Alignment Violations",
    "slug": "webgpu-buffer-alignment-fix",
    "language": "TypeScript",
    "code": "ValidationError",
    "tags": [
        "TypeScript",
        "React",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU imposes strict memory alignment rules for buffers, particularly when using 'std140' layout in WGSL or dynamic offsets. A common error occurs when the offset or size of a buffer bound to a bind group is not a multiple of 256 bytes (minUniformBufferOffsetAlignment). Failing to respect these hardware-specific constraints leads to immediate validation errors and prevents the compute shader from executing.</p>",
    "root_cause": "Buffer offsets or struct sizes failing to meet the 256-byte alignment requirement for uniform/storage buffers.",
    "bad_code": "device.createBindGroup({\n  layout: layout,\n  entries: [{\n    binding: 0,\n    resource: { buffer: myBuffer, offset: 64, size: 128 }\n  }]\n});",
    "solution_desc": "Calculate the padded size manually or use an alignment helper function to ensure every offset is a multiple of the device's 'minUniformBufferOffsetAlignment' (usually 256). For internal struct alignment, use '@align(16)' in WGSL.",
    "good_code": "const alignment = device.limits.minUniformBufferOffsetAlignment;\nconst alignedOffset = Math.ceil(currentOffset / alignment) * alignment;\n\ndevice.createBindGroup({\n  layout: layout,\n  entries: [{\n    binding: 0,\n    resource: { buffer: myBuffer, offset: alignedOffset, size: 128 }\n  }]\n});",
    "verification": "Check the browser console for the absence of 'Buffer offset is not a multiple of 256' validation errors.",
    "date": "2026-04-20",
    "id": 1776663173,
    "type": "error"
});