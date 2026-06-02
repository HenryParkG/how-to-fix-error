window.onPostDataLoaded({
    "title": "Fixing WebGPU Uniform Buffer Alignment Mismatches",
    "slug": "webgpu-uniform-buffer-alignment-mismatches",
    "language": "TypeScript",
    "code": "Alignment Error",
    "tags": [
        "TypeScript",
        "WebGPU",
        "WGSL",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU implements strict, deterministic layout specifications based on WGSL standard memory layouts (equivalent to std140/std430 in OpenGL). While designing vertex and uniform buffers, web developers frequently map Javascript/Typescript typed arrays directly to GPU memory. If the byte alignment does not precisely match the WGSL structure specification (e.g., mismatching 16-byte alignment of 3D vectors or failing to align the buffer size/offsets to multiples of 256 bytes), the GPU driver will fail with validation errors, or render corruption with shifted byte positions.</p>",
    "root_cause": "JavaScript typed arrays write packed binary values directly to buffers, while WGSL enforces strict layout alignment rules (e.g., aligning vec3<f32> to 16 bytes), causing data mapping shifts and layout validation errors.",
    "bad_code": "// Buggy: Packed float array layout ignores WGSL's 16-byte alignment rules for vec3\nconst uniformData = new Float32Array([\n    1.0, 2.0, 3.0, // position (vec3<f32>) - 12 bytes\n    0.5            // scale (f32) - starts at byte 12 instead of 16\n]);\ndevice.queue.writeBuffer(uniformBuffer, 0, uniformData);",
    "solution_desc": "Structure the CPU-side ArrayBuffer using explicit byte offsets matching WGSL memory alignment rules. Pad vectors to align to 16-byte boundaries (std140 style) so structural layouts correspond precisely between GPU and CPU.",
    "good_code": "// Fixed: CPU-side structured data with correct padding matching WGSL specs\nconst alignedBuffer = new ArrayBuffer(32); // Allocated 32 bytes for alignment stability\nconst view = new DataView(alignedBuffer);\n\n// vec3<f32> aligned to 16-byte boundary (element 0, 4, 8)\nview.setFloat32(0, 1.0, true);\nview.setFloat32(4, 2.0, true);\nview.setFloat32(8, 3.0, true);\n// Bytes 12-15 serve as explicit padding\n\n// scale (f32) starts exactly at byte 16\nview.setFloat32(16, 0.5, true);\n\ndevice.queue.writeBuffer(uniformBuffer, 0, alignedBuffer);",
    "verification": "Enable browser console GPU validation logs (via navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }) and device.pushErrorScope('validation')) to confirm zero runtime WebGPU alignment layout errors.",
    "date": "2026-06-02",
    "id": 1780403767,
    "type": "error"
});