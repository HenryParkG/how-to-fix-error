window.onPostDataLoaded({
    "title": "Fixing CUDA Fragmentation in Gradient Checkpointing",
    "slug": "cuda-memory-fragmentation-llm",
    "language": "Python",
    "code": "CUDA_OUT_OF_MEMORY",
    "tags": [
        "Python",
        "Backend",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>When training large language models (LLMs), gradient checkpointing is essential to trade compute for memory. However, developers often encounter CUDA Out-of-Memory (OOM) errors even when the total allocated memory is below the GPU limit. This is caused by memory fragmentation within the PyTorch Caching Allocator. As the forward pass discards activations and the backward pass recomputes them, the allocator creates small 'holes' of free memory that cannot be coalesced into a contiguous block large enough for the next weight update or KV-cache allocation.</p>",
    "root_cause": "The PyTorch CachingAllocator default settings do not aggressively coalesce small memory blocks during the frequent deallocation/reallocation cycles of gradient checkpointing.",
    "bad_code": "import torch\nfrom transformers import AutoModelForCausalLM\n\nmodel = AutoModelForCausalLM.from_pretrained('huge-llm-model')\n# Standard activation checkpointing without fragmentation management\nmodel.gradient_checkpointing_enable()\n# Training loop frequently crashes with OOM despite 15% 'free' VRAM",
    "solution_desc": "Configure the PyTorch allocator to use a specific 'max_split_size_mb' to prevent the creation of large non-reusable blocks and use the 'expandable_segments' feature (in PyTorch 2.0+) to allow the allocator to request memory more granularly.",
    "good_code": "import os\nimport torch\n\n# Set allocator configuration before initializing CUDA\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"max_split_size_mb:128,expandable_segments:True\"\n\nmodel = AutoModelForCausalLM.from_pretrained('huge-llm-model')\nmodel.gradient_checkpointing_enable()\n\n# Optional: Manually trigger empty_cache in validation steps\ntorch.cuda.empty_cache()",
    "verification": "Monitor memory using `torch.cuda.memory_summary()`. The 'Reserved' vs 'Allocated' gap should remain stable.",
    "date": "2026-04-03",
    "id": 1775209531,
    "type": "error"
});