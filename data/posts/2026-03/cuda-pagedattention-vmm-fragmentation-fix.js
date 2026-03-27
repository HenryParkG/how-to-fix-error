window.onPostDataLoaded({
    "title": "Fixing CUDA VMM Fragmentation in PagedAttention",
    "slug": "cuda-pagedattention-vmm-fragmentation-fix",
    "language": "Python/CUDA",
    "code": "Memory Fragmentation",
    "tags": [
        "Python",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In LLM inference engines like vLLM or HuggingFace TGI, PagedAttention manages KV caches by dividing memory into blocks. A critical performance bottleneck occurs when the system frequently allocates and deallocates physical memory chunks. Standard <code>cudaMalloc</code> calls lead to virtual address space fragmentation because the CUDA driver cannot always find contiguous virtual memory ranges to map the non-contiguous physical pages. This results in 'Out of Memory' (OOM) errors even when physical memory is available.</p>",
    "root_cause": "The failure stems from relying on the default CUDA memory allocator which does not guarantee contiguous virtual address mapping for discrete physical memory handles, leading to 'External Fragmentation' in the Virtual Memory Management (VMM) layer.",
    "bad_code": "import torch\n\n# Standard allocation for KV cache blocks\n# This causes virtual memory fragmentation over time in long-running processes\nkv_cache_blocks = []\nfor _ in range(num_blocks):\n    block = torch.empty(block_size, device='cuda')\n    kv_cache_blocks.append(block)",
    "solution_desc": "Utilize the CUDA Virtual Memory Management (VMM) API. Reserve a large contiguous virtual address space upfront using `cuMemAddressReserve`. Then, allocate physical memory chunks using `cuMemCreate` and map them into the reserved virtual range using `cuMemMap`. This ensures the application sees a contiguous virtual buffer while the underlying physical memory remains granular and paged.",
    "good_code": "/* C++ / CUDA Driver API Logic */\nCUdeviceptr vptr;\ncuMemAddressReserve(&vptr, total_size, 0, 0, 0);\n\nCUmemGenericAllocationHandle handle;\nCUmemAllocationProp prop = {};\nprop.type = CU_MEM_ALLOCATION_TYPE_PINNED;\nprop.location.type = CU_MEM_LOCATION_TYPE_DEVICE;\n\n// Allocate and Map physical chunk to virtual space\ncuMemCreate(&handle, chunk_size, &prop, 0);\ncuMemMap(vptr + offset, chunk_size, 0, handle, 0);\n\nCUmemAccessDesc accessDesc = {};\naccessDesc.location.type = CU_MEM_LOCATION_TYPE_DEVICE;\naccessDesc.flags = CU_MEM_ACCESS_FLAGS_PROT_READWRITE;\ncuMemSetAccess(vptr + offset, chunk_size, &accessDesc, 1);",
    "verification": "Monitor `nvidia-smi` and check the 'Virtual Memory' vs 'Physical Memory' utilization. Verify that long-running inference loops do not trigger OOM after thousands of block swaps.",
    "date": "2026-03-27",
    "id": 1774604846,
    "type": "error"
});