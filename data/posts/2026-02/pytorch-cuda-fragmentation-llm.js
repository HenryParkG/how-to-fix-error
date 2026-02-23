window.onPostDataLoaded({
    "title": "Mitigating PyTorch CUDA Fragmentation in LLM Serving",
    "slug": "pytorch-cuda-fragmentation-llm",
    "language": "Python",
    "code": "CUDA OOM (Fragmented)",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>In multi-tenant LLM serving environments, PyTorch's CUDA caching allocator often suffers from external fragmentation. As different request sizes (sequence lengths) come in, the allocator carves out blocks of memory. Over time, the heap becomes peppered with small free holes that are individually too small for a new large tensor allocation, even if the total free memory is sufficient.</p>",
    "root_cause": "Frequent allocation and deallocation of varied-size tensors in the CUDA caching allocator without proper segment management.",
    "bad_code": "# Default PyTorch settings in a multi-tenant FastAPI app\nimport torch\n\ndef serve_llm(prompt):\n    # Fragmentation builds up over thousands of calls\n    tokens = model.generate(prompt)",
    "solution_desc": "Configure the CUDA allocator to use 'expandable_segments' (available in newer PyTorch versions) or set a 'max_split_size_mb' to prevent the allocator from creating overly large segments that can't be reused efficiently.",
    "good_code": "import os\n# Set before any torch operations\nos.environ['PYTORCH_CUDA_ALLOC_CONF'] = \"expandable_segments:True,max_split_size_mb:128\"\n\nimport torch\n# Now the allocator manages segments more aggressively",
    "verification": "Monitor `torch.cuda.memory_stats()` specifically looking at `inactive_split_bytes`. A successful fix will show a significant reduction in this metric.",
    "date": "2026-02-23",
    "id": 1771811129,
    "type": "error"
});