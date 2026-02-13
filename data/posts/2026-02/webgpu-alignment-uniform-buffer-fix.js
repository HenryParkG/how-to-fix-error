window.onPostDataLoaded({
    "title": "WebGPU Alignment: Fixing Uniform Buffer Padding",
    "slug": "webgpu-alignment-uniform-buffer-fix",
    "language": "TypeScript",
    "code": "MemoryAlignment",
    "tags": [
        "TypeScript",
        "WebGPU",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU follows the WGSL <code>std140</code> and <code>std430</code> layout rules for uniform and storage buffers. A common trap occurs when developers pass a flat <code>Float32Array</code> from JavaScript that doesn't account for the 16-byte alignment required for vectors like <code>vec3</code> or <code>vec4</code>. This results in the GPU reading garbage data or shifted values from the buffer.</p>",
    "root_cause": "The memory layout in JavaScript (densely packed) does not match the GPU's requirement where certain types must start at offsets that are multiples of 16 bytes.",
    "bad_code": "const bufferData = new Float32Array([\n    1.0, 0.0, 0.0, // position (vec3)\n    1.0,           // scale (f32) - Mistakenly packed right after\n]);\n// GPU expects vec3 to occupy 16 bytes, not 12.",
    "solution_desc": "Manually pad the data structure in JavaScript to ensure every vec3 is followed by 4 bytes of padding, or use a 16-byte stride for all elements in the uniform block.",
    "good_code": "const bufferData = new Float32Array([\n    1.0, 0.0, 0.0, 0.0, // position (vec3) + 4 bytes padding\n    1.0, 0.0, 0.0, 0.0  // scale (f32) + 12 bytes padding\n]);\n// Total 32 bytes, matching WGSL std140 layout requirements.",
    "verification": "Use a GPU debugger like Spector.js or Chrome's WebGPU Inspector to verify the buffer contents match the expected struct layout.",
    "date": "2026-02-13",
    "id": 1770965370,
    "type": "error"
});