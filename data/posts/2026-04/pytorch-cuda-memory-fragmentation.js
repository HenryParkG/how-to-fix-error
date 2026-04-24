window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA Fragmentation in Inference",
    "slug": "pytorch-cuda-memory-fragmentation",
    "language": "Python",
    "code": "CUDA_OUT_OF_MEMORY",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Multi-tenant inference servers often suffer from CUDA memory fragmentation. PyTorch's caching allocator might hold onto small blocks of memory, preventing the allocation of a single large contiguous block for a new request, even if the total free memory is theoretically sufficient.</p>",
    "root_cause": "The default caching allocator strategy results in 'external fragmentation' where free memory is split into non-contiguous segments across the GPU heap.",
    "bad_code": "import torch\nmodel = load_model()\n# Standard inference loop in a web server\nfor batch in request_stream:\n    output = model(batch.cuda()) # Crashes with OOM despite free memory",
    "solution_desc": "Configure the PyTorch allocator using the `PYTORCH_CUDA_ALLOC_CONF` environment variable to set a `max_split_size_mb`. This forces the allocator to prevent large blocks from being split into tiny pieces that cause fragmentation.",
    "good_code": "import os\nos.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512'\n\nimport torch\n# Clear cache periodically in multi-tenant environments\nif torch.cuda.memory_reserved() > threshold:\n    torch.cuda.empty_cache()",
    "verification": "Monitor 'nvidia-smi' and 'torch.cuda.memory_summary()' to observe the reduction in 'inactive_split' memory blocks.",
    "date": "2026-04-24",
    "id": 1777016975,
    "type": "error"
});