window.onPostDataLoaded({
    "title": "Mitigating PyTorch CUDA Memory Fragmentation",
    "slug": "pytorch-cuda-memory-fragmentation",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "PyTorch",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Distributed LLM fine-tuning often encounters 'RuntimeError: CUDA out of memory' even when the total reported free memory exceeds the requested allocation. This is caused by memory fragmentation within the CUDA caching allocator. When varying sequence lengths are processed, the allocator creates holes of free memory that are too small to house new large tensors, eventually failing to find a contiguous block despite having sufficient aggregate capacity.</p>",
    "root_cause": "The caching allocator's tendency to hold onto blocks of specific sizes, combined with the dynamic memory requirements of attention masks and gradients in LLMs.",
    "bad_code": "for batch in dataloader:\n    output = model(batch) # Implicitly triggers fragmentation over time\n    loss = criterion(output, targets)\n    loss.backward()\n    optimizer.step()",
    "solution_desc": "Configure the CUDA allocator using the 'expandable_segments' setting and implement periodic manual cache clearing. Alternatively, use a memory-efficient backend like FlashAttention to reduce the size of intermediate activations.",
    "good_code": "import os\nimport torch\n\n# Set allocator configuration before any CUDA calls\nos.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'\n\n# Inside training loop\ntorch.cuda.empty_cache() # Periodically clear if fragmentation persists",
    "verification": "Monitor memory using torch.cuda.memory_summary(). Check 'active_blocks' vs 'inactive_split_blocks' to see fragmentation efficiency.",
    "date": "2026-04-02",
    "id": 1775105844,
    "type": "error"
});