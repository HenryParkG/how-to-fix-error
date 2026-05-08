window.onPostDataLoaded({
    "title": "Fixing WebGPU Buffer Alignment Violations in WGSL",
    "slug": "webgpu-buffer-alignment-wgsl-fix",
    "language": "TypeScript",
    "code": "AlignmentError",
    "tags": [
        "TypeScript",
        "Frontend",
        "GPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU follows strict layout rules (STD140/STD430) for uniform and storage buffers. A common error is passing a CPU-side Float32Array that doesn't account for the required 16-byte alignment of vectors like `vec3<f32>` or `vec4<f32>`. In WGSL, a `vec3` is often treated as having the same alignment as a `vec4`, meaning a 3-component vector actually occupies the space of 4 floats. If your TypeScript buffer doesn't match this, data will be misaligned or the API will throw a validation error.</p>",
    "root_cause": "The GPU expects 16-byte (4-float) alignment for struct members in uniform buffers, while TypeScript developers often pack data tightly without padding.",
    "bad_code": "// WGSL: struct Data { pos: vec3<f32>, color: vec3<f32> }\nconst data = new Float32Array([\n    1.0, 2.0, 3.0, // pos\n    1.0, 0.0, 0.0  // color (WRONG: starts at byte 12, needs 16)\n]);",
    "solution_desc": "Manually add padding to the TypeScript arrays to match the WGSL expectations, or use the `@align(16)` attribute in WGSL to explicitly define the layout, ensuring the CPU-side byte length is a multiple of 16.",
    "good_code": "// WGSL: struct Data { pos: vec3<f32>, @align(16) color: vec3<f32> }\nconst data = new Float32Array([\n    1.0, 2.0, 3.0, 0.0, // pos + padding\n    1.0, 0.0, 0.0, 0.0  // color + padding\n]);",
    "verification": "Check the Chrome/Edge DevTools console. The validation error 'Offset ... is not a multiple of 16' should disappear.",
    "date": "2026-05-08",
    "id": 1778206048,
    "type": "error"
});