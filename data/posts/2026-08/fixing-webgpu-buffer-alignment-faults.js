window.onPostDataLoaded({
    "title": "Fixing WebGPU Buffer Alignment Faults in Multi-Pass Pipelines",
    "slug": "fixing-webgpu-buffer-alignment-faults",
    "language": "TypeScript",
    "code": "GPUValidationError",
    "tags": [
        "WebGPU",
        "WGSL",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU strictly enforces memory alignment rules for uniform and storage buffers according to the WGSL specification. In multi-pass compute pipelines, transferring struct representations across passes fails with a validation error if dynamic offsets or structure field layouts do not align to required byte boundaries (e.g., 16-byte alignment for vec4 structures or dynamic offset alignments of 256 bytes for uniform buffers).</p>",
    "root_cause": "Struct fields in WGSL and buffer offsets in WebGPU API fail to conform to WebGPU's strict byte alignment requirements (e.g., 16-byte alignment for 128-bit vectors and 256-byte alignment for dynamic uniform buffer offsets).",
    "bad_code": "// WGSL Shader Struct\n// struct Particle {\n//   pos: vec3<f32>, // Offset 0, Size 12\n//   velocity: f32,  // Offset 12, Size 4 -> Next vec4 alignment fault!\n//   color: vec4<f32> // Alignment fault: vec4 requires 16-byte alignment\n// };\n\nconst buffer = device.createBuffer({\n  size: 1000,\n  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,\n});\n\npassEncoder.setBindGroup(0, bindGroup, [128]); // Error: Offset 128 is not aligned to 256 bytes",
    "solution_desc": "Explicitly align WGSL struct fields using `@align()` annotations and pad struct sizes. Ensure dynamic buffer offset calculations round up to `minUniformBufferOffsetAlignment` (typically 256 bytes).",
    "good_code": "// Fixed WGSL Shader Struct with explicit alignment and padding\n// struct Particle {\n//   @align(16) pos: vec3<f32>,\n//   @align(4)  velocity: f32,\n//   @align(16) color: vec4<f32>\n// };\n\nconst alignment = device.limits.minUniformBufferOffsetAlignment; // Typically 256\nconst byteOffset = Math.ceil(100 / alignment) * alignment; // Perfectly aligned to 256\n\nconst buffer = device.createBuffer({\n  size: byteOffset + 256,\n  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,\n});\n\npassEncoder.setBindGroup(0, bindGroup, [byteOffset]);",
    "verification": "Run the WebGPU pipeline with browser validation layers enabled and confirm zero `GPUValidationError` logs during buffer binding and dispatch execution.",
    "date": "2026-08-10",
    "id": 1786323619,
    "type": "error"
});