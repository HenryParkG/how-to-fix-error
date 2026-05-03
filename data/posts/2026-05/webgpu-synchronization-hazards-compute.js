window.onPostDataLoaded({
    "title": "Fixing WebGPU Synchronization Hazards in Compute Shaders",
    "slug": "webgpu-synchronization-hazards-compute",
    "language": "WebGPU/WGSL",
    "code": "SyncHazard",
    "tags": [
        "TypeScript",
        "Frontend",
        "WebGPU",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU compute shaders execute in parallel across many workgroups. A common hazard occurs when multiple workgroups read from and write to the same storage buffer without explicit memory barriers. Since the GPU scheduler provides no execution order guarantees between different workgroups, this leads to race conditions where a read might occur before a previous write has committed to global memory, causing flickering or incorrect data processing.</p>",
    "root_cause": "Missing storageBarriers in WGSL or lack of command encoder barriers between dependent compute passes, leading to Read-After-Write (RAW) hazards.",
    "bad_code": "@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) id: vec3<u32>) {\n    // Writing to a buffer and reading it back immediately in another group\n    data[id.x] = data[id.x] * 2.0;\n    let val = data[id.x + 1]; // Race condition: neighbor might not be updated\n}",
    "solution_desc": "Use workgroupBarriers() for intra-group synchronization and split dependent operations into multiple compute passes (dispatch calls) with the appropriate buffer usages to let the WebGPU implementation insert hardware-level barriers.",
    "good_code": "// Split into two dispatches or use workgroup memory for intra-group\n@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) id: vec3<u32>) {\n    // Pass 1: Compute logic\n    temp_storage[id.x] = input[id.x] * 2.0;\n    workgroupBarrier(); // Syncs threads in the same workgroup\n    // Pass 2: Consumption logic\n    let result = temp_storage[id.x] + temp_storage[(id.x + 1) % 64];\n}",
    "verification": "Enable WebGPU validation layers in Chrome/Edge and check for 'Overlap of usage' warnings. Use a GPU capture tool (like RenderDoc) to verify memory transition barriers.",
    "date": "2026-05-03",
    "id": 1777787424,
    "type": "error"
});