window.onPostDataLoaded({
    "title": "Fixing WGSL Uniform Buffer Alignment Hazards",
    "slug": "webgpu-wgsl-alignment-hazards",
    "language": "TypeScript",
    "code": "AlignmentError",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebGPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU and WGSL have strict memory layout rules for Uniform Buffers. A common pitfall is the difference between JavaScript's Float32Array packing and WGSL's 16-byte alignment requirement for structures and certain vectors (like vec3).</p><p>When these don't match, the GPU reads garbage data or shifts indices, leading to distorted geometry or flickering. For instance, a <code>vec3</code> in WGSL is treated as having the same alignment as a <code>vec4</code>.</p>",
    "root_cause": "Failing to account for the 16-byte alignment requirement (std140-like) in WGSL, specifically with vec3 and mixed-type structs.",
    "bad_code": "// WGSL side\nstruct Config {\n    color: vec3<f32>,\n    intensity: f32,\n}\n\n// JS side - Tightly packed (4 + 1 = 5 floats)\nconst bufferData = new Float32Array([\n    1.0, 0.0, 0.0, // color\n    0.5            // intensity\n]);",
    "solution_desc": "Manually pad your TypedArrays in JavaScript to match the 16-byte (4-float) alignment requirement of WGSL vec3/vec4 structures.",
    "good_code": "// WGSL side\nstruct Config {\n    color: vec3<f32>,\n    _pad: f32,\n    intensity: f32,\n    _pad2: vec3<f32>,\n}\n\n// JS side - Padded for 16-byte alignment (vec3 + 1 float padding)\nconst bufferData = new Float32Array([\n    1.0, 0.0, 0.0, 0.0, // color + padding\n    0.5, 0.0, 0.0, 0.0  // intensity + padding\n]);",
    "verification": "Use the 'WebGPU Inspector' browser extension to inspect buffer memory. Ensure the byte offsets in the GPU buffer match your JS object offsets.",
    "date": "2026-02-18",
    "id": 1771377550,
    "type": "error"
});