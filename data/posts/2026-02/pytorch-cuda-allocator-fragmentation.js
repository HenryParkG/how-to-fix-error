window.onPostDataLoaded({
    "title": "Mitigating PyTorch CUDA Allocator Fragmentation",
    "slug": "pytorch-cuda-allocator-fragmentation",
    "language": "Python",
    "code": "OutOfMemory",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>During LLM fine-tuning, the PyTorch Caching Allocator often encounters fragmentation. This occurs when the allocator keeps many small, non-contiguous free blocks that cannot be merged to satisfy a large allocation request (like a large attention matrix), resulting in a 'CUDA Out of Memory' (OOM) error even when total free memory appears sufficient.</p>",
    "root_cause": "Frequent allocations of varying sizes and the use of activation checkpointing create interleaved free and occupied blocks that the default caching strategy fails to consolidate efficiently.",
    "bad_code": "import torch\n# Default settings often lead to fragmentation in LLMs\nmodel = AutoModelForCausalLM.from_pretrained('huge-llm')\nfor batch in loader:\n    loss = model(batch).loss\n    loss.backward()",
    "solution_desc": "Configure the CUDA allocator via environment variables to use 'expandable_segments'. This allows the allocator to use virtual memory management to maintain contiguous address spaces, significantly reducing fragmentation.",
    "good_code": "import os\nimport torch\n\n# Enable expandable segments to prevent fragmentation\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True\"\n\n# Optional: periodically clear cache for extreme cases\ntorch.cuda.empty_cache()",
    "verification": "Use torch.cuda.memory_summary() to inspect the 'Fraction of blocked memory' and 'Max split size' before and after applying the configuration.",
    "date": "2026-02-21",
    "id": 1771655540,
    "type": "error"
});