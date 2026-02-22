window.onPostDataLoaded({
    "title": "Mitigating WebGPU Buffer Alignment Faults",
    "slug": "webgpu-buffer-alignment-faults-compute",
    "language": "WGSL / TypeScript",
    "code": "GPUValidationError",
    "tags": [
        "TypeScript",
        "Frontend",
        "Next.js",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU imposes strict memory alignment requirements for buffers, particularly when using uniform buffers or storage buffers with dynamic offsets. A common error occurs when the CPU-side data layout (e.g., a Float32Array) does not match the WGSL structure alignment rules (std140/std430). For instance, a <code>vec3<f32></code> in WGSL is treated as a 16-byte object, but developers often provide only 12 bytes in TypeScript, causing subsequent fields to align incorrectly and triggering validation errors or silent data corruption.</p>",
    "root_cause": "Mismatch between TypeScript array packing and WebGPU's mandatory 16-byte alignment for specific vector types and 256-byte alignment for uniform buffer offsets.",
    "bad_code": "// TS Side: Total 24 bytes\nconst data = new Float32Array([\n    1.0, 2.0, 3.0, // vec3\n    4.0, 5.0, 6.0  // vec3\n]);\n\n// WGSL Side:\nstruct Params {\n    v1: vec3<f32>,\n    v2: vec3<f32>,\n};",
    "solution_desc": "Manually pad the TypeScript data to match the 16-byte alignment (4 floats) required for <code>vec3</code>. Alternatively, use a helper library like <code>gpu-buffer-utils</code> or always use <code>vec4</code> to ensure natural alignment.",
    "good_code": "// TS Side: Pad to 32 bytes (16 bytes per vec3)\nconst data = new Float32Array([\n    1.0, 2.0, 3.0, 0.0, // vec3 + padding\n    4.0, 5.0, 6.0, 0.0  // vec3 + padding\n]);\n\n// Or use @align(16) in WGSL struct definitions",
    "verification": "Check the browser's developer console for 'Offset is not a multiple of 256' or 'Buffer size does not match structure' validation errors.",
    "date": "2026-02-22",
    "id": 1771752202,
    "type": "error"
});