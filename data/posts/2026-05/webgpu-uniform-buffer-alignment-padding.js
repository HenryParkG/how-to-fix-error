window.onPostDataLoaded({
    "title": "Resolving WebGPU Uniform Buffer Alignment Violations",
    "slug": "webgpu-uniform-buffer-alignment-padding",
    "language": "TypeScript",
    "code": "ValidationError",
    "tags": [
        "TypeScript",
        "Frontend",
        "Graphics",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU enforces strict layout rules for Uniform Buffer Objects (UBOs). Unlike standard JavaScript arrays, GPU memory requires specific byte alignments. For instance, a 'vec3' in WGSL is treated as having the same alignment as a 'vec4' (16 bytes).</p><p>Developers often experience errors when their TypeScript Float32Array doesn't match the expected layout of the WGSL struct, resulting in 'Offset is not a multiple of 256' or 'Buffer size is insufficient' errors during the bind group creation.</p>",
    "root_cause": "WGSL structs follow std140/std430-like rules where types must be aligned to powers of 2 (vec3 requires 16-byte alignment), and bind group offsets must be multiples of 256.",
    "bad_code": "// WGSL: struct Data { pos: vec3<f32>, color: vec4<f32> }\nconst data = new Float32Array([\n    1.0, 2.0, 3.0, // pos (Only 12 bytes! Next field will be misaligned)\n    1.0, 0.0, 0.0, 1.0 // color\n]);",
    "solution_desc": "Add manual padding to the CPU-side buffer to ensure every 'vec3' occupies 16 bytes (4 floats) and ensure the overall buffer size is a multiple of the required alignment.",
    "good_code": "// Correctly padded for 16-byte alignment of vec3\nconst data = new Float32Array([\n    1.0, 2.0, 3.0, 0.0, // pos + padding\n    1.0, 0.0, 0.0, 1.0  // color\n]);",
    "verification": "Check the Chrome DevTools console for 'GPUValidationError' and verify that 'device.limits.minUniformBufferOffsetAlignment' is respected.",
    "date": "2026-05-16",
    "id": 1778926074,
    "type": "error"
});