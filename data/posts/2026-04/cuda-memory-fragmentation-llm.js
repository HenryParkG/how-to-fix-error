window.onPostDataLoaded({
    "title": "Fixing CUDA Memory Fragmentation in LLM Inference",
    "slug": "cuda-memory-fragmentation-llm",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput LLM inference servers (like those using FastAPI or vLLM), frequent allocation and deallocation of KV-cache tensors and activation buffers lead to external memory fragmentation. Even if <code>nvidia-smi</code> shows free memory, the CUDA allocator might fail to find a single contiguous block large enough for a new request, resulting in an Out of Memory (OOM) error despite sufficient total capacity.</p>",
    "root_cause": "The default PyTorch/CUDA caching allocator creates small holes in memory blocks when handling varying sequence lengths, preventing the allocation of large contiguous tensors.",
    "bad_code": "# Standard inference loop without memory management\nfor batch in loader:\n    output = model.generate(batch)\n    # Results in fragmented chunks over thousands of requests",
    "solution_desc": "Set the `PYTORCH_CUDA_ALLOC_CONF` environment variable to use 'expandable_segments:True' and 'max_split_size_mb' to force the allocator to reuse segments more efficiently, or implement PagedAttention to manage memory in fixed-size blocks.",
    "good_code": "import os\n# Set before importing torch\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True,max_split_size_mb:128\"\n\nimport torch\ntorch.cuda.empty_cache()",
    "verification": "Monitor `torch.cuda.memory_stats()` specifically looking for 'active_queries.all.allocated' vs 'reserved' gaps during high load.",
    "date": "2026-04-19",
    "id": 1776582460,
    "type": "error"
});