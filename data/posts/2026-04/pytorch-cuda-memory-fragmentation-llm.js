window.onPostDataLoaded({
    "title": "Fix CUDA Memory Fragmentation in Distributed LLM Training",
    "slug": "pytorch-cuda-memory-fragmentation-llm",
    "language": "Python",
    "code": "OOM_CUDA_FRAGMENTATION",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>In distributed LLM training using FSDP or DeepSpeed, users often encounter Out-Of-Memory (OOM) errors despite having sufficient free VRAM. This is caused by CUDA memory fragmentation, where the allocator creates many small 'holes' in the memory space. When a large activation or gradient tensor needs a contiguous block, the allocator fails because no single block is large enough, even if the sum of free blocks exceeds the request.</p>",
    "root_cause": "The default PyTorch caching allocator doesn't handle the interleaved lifecycle of small optimizer states and massive transient activation tensors in distributed contexts efficiently.",
    "bad_code": "import torch\nimport torch.distributed as dist\n\n# Standard training loop without memory management\nfor data in dataloader:\n    optimizer.zero_grad()\n    output = model(data)\n    loss = criterion(output, targets)\n    loss.backward()\n    optimizer.step()",
    "solution_desc": "Configure the PyTorch allocator to use 'expandable_segments' which prevents the allocator from creating fragmented blocks, and set a specific 'max_split_size_mb' to force the recycling of smaller segments.",
    "good_code": "import os\nimport torch\n\n# Prevent fragmentation by setting allocator configuration\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True,max_split_size_mb:128\"\n\n# Optional: Manual cache clearing at synchronization points\nif dist.get_rank() == 0:\n    torch.cuda.empty_cache()",
    "verification": "Run 'torch.cuda.memory_summary()' to observe the 'Largest Free Block' vs 'Total Free Memory' ratio.",
    "date": "2026-04-30",
    "id": 1777514624,
    "type": "error"
});