window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA Memory Fragmentation OOM",
    "slug": "pytorch-cuda-fragmentation-oom-fix",
    "language": "Python",
    "code": "CUDA_OOM",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>CUDA Out-of-Memory (OOM) errors in PyTorch often occur even when 'nvidia-smi' shows significant free memory. This is usually due to fragmentation within PyTorch's caching allocator. When the allocator cannot find a contiguous block of memory large enough for a new tensor, it triggers an OOM, despite the sum of small free holes being sufficient.</p>",
    "root_cause": "The PyTorch allocator keeps blocks of memory in a cache to avoid expensive CUDA malloc calls. Over time, frequent allocations and deletions of varying sizes create 'holes'. If the largest contiguous hole is smaller than the requested size, the allocation fails.",
    "bad_code": "import torch\n\n# Repeatedly creating and deleting tensors of varying sizes\nfor i in range(1000):\n    x = torch.randn(1024, 1024, device='cuda')\n    y = torch.randn(i % 500 + 1, 1024, device='cuda')\n    del x, y # Small holes are left behind",
    "solution_desc": "Use the environment variable 'PYTORCH_CUDA_ALLOC_CONF' to set 'max_split_size_mb'. This prevents the allocator from creating large blocks that cannot be split, effectively reducing the size of potential fragments. Additionally, periodic calls to torch.cuda.empty_cache() can help defragment, though it comes with a performance penalty.",
    "good_code": "import os\n# Set before importing torch or running script\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"max_split_size_mb:128\"\n\nimport torch\n# Clear cache manually if fragmentation is detected\ntorch.cuda.empty_cache()",
    "verification": "Run 'torch.cuda.memory_summary()' to inspect the 'segment_size' vs 'active_size' and ensure the 'max_split_size_mb' is effectively reducing large block retention.",
    "date": "2026-02-13",
    "id": 1770975347,
    "type": "error"
});