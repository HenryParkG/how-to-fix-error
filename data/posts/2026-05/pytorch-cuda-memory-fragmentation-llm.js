window.onPostDataLoaded({
    "title": "Mitigating PyTorch CUDA Fragmentation in LLM Inference",
    "slug": "pytorch-cuda-memory-fragmentation-llm",
    "language": "Python",
    "code": "CudaOOM",
    "tags": [
        "Python",
        "Backend",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>In long-context LLM inference, the KV cache grows dynamically, requiring large contiguous blocks of VRAM. PyTorch's default caching allocator works by requesting segments from the GPU driver and slicing them into blocks. However, when interleaving short-lived intermediate tensors with long-lived KV cache tensors, the allocator can leave small 'holes' of free memory that are too small for large cache allocations, leading to an Out of Memory (OOM) error even when total free memory is sufficient.</p>",
    "root_cause": "The allocator cannot merge non-adjacent free blocks, and large allocations fail when they cannot find a single contiguous segment in the fragmented heap.",
    "bad_code": "import torch\n# Standard inference loop without memory management\nfor input_ids in data_loader:\n    output = model(input_ids) # Fails with OOM after several iterations\n    process(output)",
    "solution_desc": "Configure the PyTorch allocator to use 'expandable_segments' which allows the allocator to map memory in a way that reduces physical fragmentation. Additionally, use torch.cuda.empty_cache() cautiously or implement a PagedAttention-style buffer management.",
    "good_code": "import os\nimport torch\n\n# Set before first CUDA call\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True\"\n\n# Use a context manager to clear cache in loops\nwith torch.no_grad():\n    for input_ids in data_loader:\n        try:\n            output = model(input_ids)\n        except RuntimeError as e:\n            if \"out of memory\" in str(e):\n                torch.cuda.empty_cache()\n                output = model(input_ids)\n            else: raise e",
    "verification": "Monitor memory using torch.cuda.memory_summary(). Check the 'fragmentation' metric; it should decrease significantly with expandable_segments enabled.",
    "date": "2026-05-03",
    "id": 1777787425,
    "type": "error"
});