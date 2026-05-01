window.onPostDataLoaded({
    "title": "Mitigating GPU Memory Fragmentation in PyTorch Caching",
    "slug": "pytorch-gpu-memory-fragmentation-fix",
    "language": "Python",
    "code": "OutOfMemory",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>PyTorch uses a caching allocator to speed up memory allocations by avoiding frequent CUDA synchronization. However, in workloads with variable input shapes (like NLP sequences of different lengths), the allocator can reserve large blocks of memory that it doesn't fully utilize. Over time, this leads to fragmentation: the GPU has enough total free memory to fulfill a request, but it lacks a contiguous block of the required size. This results in the dreaded 'CUDA out of memory' error even when nvidia-smi shows significant free space.</p>",
    "root_cause": "The Caching Allocator holds onto freed blocks for future reuse, but varying allocation sizes create 'holes' that cannot be consolidated without a manual trigger or specific configuration.",
    "bad_code": "for data in variable_length_loader:\n    outputs = model(data) # Progressively fragments memory\n    loss = criterion(outputs, labels)\n    loss.backward()\n    optimizer.step()",
    "solution_desc": "Implement a two-pronged approach: use 'max_split_size_mb' to prevent the allocator from creating excessively large blocks that are hard to reuse, and periodically call 'empty_cache' if fragmentation persists, though the environment variable is preferred for performance.",
    "good_code": "import os\n# Set before importing torch\nos.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:128'\n\nimport torch\n# Inside training loop if OOM persists\nif step % 100 == 0:\n    torch.cuda.empty_cache()",
    "verification": "Run torch.cuda.memory_summary() to check the 'Fraction of used/reserved memory' and ensure the 'Max Split Size' is being respected.",
    "date": "2026-05-01",
    "id": 1777630583,
    "type": "error"
});