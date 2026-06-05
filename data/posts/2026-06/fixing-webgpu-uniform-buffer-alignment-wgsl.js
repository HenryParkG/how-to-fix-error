window.onPostDataLoaded({
    "title": "Fixing WebGPU Uniform Buffer Alignment in WGSL",
    "slug": "fixing-webgpu-uniform-buffer-alignment-wgsl",
    "language": "TypeScript",
    "code": "Layout Mismatch",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU and WGSL require strict memory layout practices inside shader buffers. Specifically, uniform buffers must adhere to precise alignment requirements similar to the std140 layout in GLSL. Each data type within a uniform buffer has an alignment constraint: <code>f32</code> requires 4 bytes, <code>vec2&lt;f32&gt;</code> requires 8 bytes, and <code>vec3&lt;f32&gt;</code> or <code>vec4&lt;f32&gt;</code> requires 16 bytes. Furthermore, the overall size of a uniform buffer block must be a multiple of 16 bytes (and binds are often subject to a 256-byte alignment depending on device limits). If the CPU-side <code>Float32Array</code> buffer packing does not match the precise byte offsets expected by the WGSL compiler, the shader will read garbage memory or trigger pipeline validation errors.</p>",
    "root_cause": "The structural layout on the CPU (written as a continuous Float32Array) fails to account for the implicit padding required by WGSL structs, leading to visual artifacts or out-of-bounds shader errors.",
    "bad_code": "/* WGSL Shader */\nstruct SceneUniforms {\n    lightPos: vec3<f32>, // Offset 0, alignment 16\n    color: vec4<f32>,    // Expected offset: 16 (since vec3 occupies 12 bytes + 4 bytes padding)\n    intensity: f32       // Expected offset: 32\n};\n\n// TypeScript - Faulty tight packing layout\nconst uniformData = new Float32Array([\n    1.0, 2.0, 3.0,      // lightPos (3 floats = 12 bytes)\n    1.0, 0.0, 0.0, 1.0, // color (4 floats = 16 bytes) -> starts at byte 12 instead of 16!\n    1.5                 // intensity (1 float = 4 bytes)\n]);",
    "solution_desc": "To fix alignment mismatches, we must introduce explicit padding fields on both the CPU buffer array and (optionally) the WGSL struct definition. In this scenario, we must pad the `lightPos` (vec3) with an extra 4 bytes (1 float) so that the subsequent `vec4` struct member begins at a 16-byte boundary. We must also pad the end of the uniform block so that its total byte size is a multiple of 16 bytes.",
    "good_code": "/* WGSL Shader */\nstruct SceneUniforms {\n    lightPos: vec3<f32>,\n    // Implicit 4-byte padding added automatically by WGSL to align 'color' to 16 bytes\n    color: vec4<f32>,\n    intensity: f32,\n    _padding: f32, // Padding to make the total struct size a multiple of 16 bytes (36 + 4 + 8 = 48 bytes)\n    _padding2: vec2<f32>\n};\n\n// TypeScript - Aligned layout matching WGSL constraints\nconst uniformData = new Float32Array([\n    1.0, 2.0, 3.0, 0.0, // lightPos (vec3) + 1 float explicit padding (16 bytes total)\n    1.0, 0.0, 0.0, 1.0, // color (vec4) (16 bytes, offset 16)\n    1.5, 0.0,           // intensity (f32) + 1 float padding (8 bytes total, offset 32)\n    0.0, 0.0            // 2 floats padding to align total block size to 16-byte bounds (48 bytes total)\n]);",
    "verification": "Run the WebGPU application in Google Chrome with `--enable-dawn-features=dump_shaders` or check WebGPU capture tools. Ensure that the values parsed by the shader match the expected CPU input exactly, and that the browser console shows no GPUPipelineError warnings.",
    "date": "2026-06-05",
    "id": 1780642731,
    "type": "error"
});