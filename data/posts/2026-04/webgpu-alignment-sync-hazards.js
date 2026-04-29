window.onPostDataLoaded({
    "title": "WebGPU Buffer Alignment and Synchronization Hazards",
    "slug": "webgpu-alignment-sync-hazards",
    "language": "WebGPU/WGSL",
    "code": "Alignment/Sync Error",
    "tags": [
        "WebGPU",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU enforces strict memory alignment rules for Uniform and Storage buffers (typically 16-byte alignment for structures). Furthermore, since compute shaders run asynchronously, failing to implement proper barriers between write and read operations on the same buffer leads to 'Race Conditions' where old or corrupted data is fetched by subsequent shader stages.</p>",
    "root_cause": "Misaligned struct offsets in WGSL (e.g., placing a vec3 next to a f32) and missing storage barriers in the compute pass.",
    "bad_code": "struct Data {\n    pos: vec3<f32>,\n    active: f32, // Error: vec3 requires 16-byte alignment\n}\n\n@compute @workgroup_size(64)\nfn main() {\n    data[id] = calculate();\n    // Missing storageBarrier() before reading result\n    let val = data[id];\n}",
    "solution_desc": "Ensure all structures follow the 16-byte alignment rule using padding variables or explicit `@align(16)` attributes. Use `storageBarrier()` to synchronize memory access within a workgroup.",
    "good_code": "struct Data {\n    @size(16) pos: vec3<f32>,\n    active: f32,\n    _pad: vec3<f32>, // Explicit padding to 16-byte boundary\n}\n\n@compute @workgroup_size(64)\nfn main() {\n    storage_buffer[id] = result;\n    storageBarrier(); // Sync memory within workgroup\n    let safe_val = storage_buffer[id];\n}",
    "verification": "Enable 'Validation Layers' in the browser's developer flags. Check for 'alignment' or 'resource contention' warnings in the console.",
    "date": "2026-04-29",
    "id": 1777428230,
    "type": "error"
});