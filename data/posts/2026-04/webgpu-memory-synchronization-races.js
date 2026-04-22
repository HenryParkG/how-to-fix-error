window.onPostDataLoaded({
    "title": "Resolving WebGPU Memory Synchronization Races",
    "slug": "webgpu-memory-synchronization-races",
    "language": "TypeScript",
    "code": "DATA_RACE_CONDITION",
    "tags": [
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In WebGPU parallel compute shaders, memory races occur when multiple workgroups attempt to read and write to the same storage buffer locations without explicit synchronization. Unlike serial CPU code, WebGPU does not guarantee execution order between workgroups or even within workgroups without memory barriers, leading to non-deterministic output.</p>",
    "root_cause": "Missing storageBarrier() in WGSL shaders or lack of compute pass synchronization when dependent dispatches are executed sequentially.",
    "bad_code": "/* WGSL Shader */\n@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) id : vec3<u32>) {\n    let val = data[id.x];\n    data[id.x + 1u] = val + 1.0; // Race: Neighbor might be reading this\n}",
    "solution_desc": "Use storageBarrier() to synchronize memory access within a workgroup, and split dependent operations into separate compute passes if global synchronization is required.",
    "good_code": "/* WGSL Shader with Barrier */\n@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) id : vec3<u32>) {\n    temp_cache[id.x] = data[id.x];\n    storageBarrier(); // Sync all threads in workgroup\n    data[id.x] = temp_cache[id.x] + 1.0;\n}",
    "verification": "Enable WebGPU Validation Layers in Chrome/Edge and check for 'Overlap of usage' or 'Hazard' warnings in the console.",
    "date": "2026-04-22",
    "id": 1776821430,
    "type": "error"
});