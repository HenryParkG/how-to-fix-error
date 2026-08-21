window.onPostDataLoaded({
    "title": "Fix PyTorch CUDA Fragmentation & Dynamic Shape OOMs",
    "slug": "pytorch-cuda-caching-allocator-fragmentation-oom",
    "language": "Python",
    "code": "CUDA_OUT_OF_MEMORY",
    "tags": [
        "Python",
        "AWS",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In deep learning workloads dealing with variable-length sequences or dynamic batch sizes, PyTorch applications frequently terminate with <code>torch.cuda.OutOfMemoryError: CUDA out of memory</code> despite nvidia-smi showing significant free GPU memory. This is caused by virtual memory fragmentation inside the <code>CUDACachingAllocator</code>.</p><p>When tensors with fluctuating dimensions are repeatedly allocated and deallocated, memory blocks of non-uniform sizes are split across memory pools. Over time, the allocator cannot find a single contiguous unallocated segment large enough to satisfy an incoming tensor allocation, triggering an unrecoverable out-of-memory exception.</p>",
    "root_cause": "Frequent dynamic shape variances causing block-splitting in the caching allocator without segment re-use, exacerbated by the default 20MB split-threshold and lack of virtual memory expandable segment mapping.",
    "bad_code": "import torch\nimport torch.nn as nn\n\n# Dynamic batch training without bucketing or allocator tuning\nmodel = nn.Transformer(d_model=1024, nhead=16).cuda()\n\ndef train_step(variable_length_batches):\n    for batch in variable_length_batches:\n        # Highly variable sequence lengths: (e.g., 32, 512, 128, 2048)\n        src = batch.cuda() \n        output = model(src, src)\n        loss = output.sum()\n        loss.backward()\n        # Allocator accumulates fragmented free blocks",
    "solution_desc": "Resolve memory fragmentation by: (1) enabling PyTorch's `expandable_segments:True` backend utilizing modern CUDA Virtual Memory Management APIs (`cuMemMap`), (2) tuning `max_split_size_mb` to prevent large block fragmentation, and (3) employing dynamic sequence bucketing to minimize tensor shape variance across consecutive steps.",
    "good_code": "import os\nimport torch\nimport torch.nn as nn\n\n# 1. Configure CUDACachingAllocator environment flags\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"max_split_size_mb:128,expandable_segments:True\"\n\nmodel = nn.Transformer(d_model=1024, nhead=16).cuda()\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)\n\ndef train_step_optimized(bucketed_dataloader):\n    for batch in bucketed_dataloader:\n        optimizer.zero_grad(set_to_none=True)\n        # Batches are sorted and bucketed by length to prevent shape oscillation\n        src = batch.cuda(non_blocking=True)\n        output = model(src, src)\n        loss = output.sum()\n        loss.backward()\n        optimizer.step()",
    "verification": "Run `torch.cuda.memory_summary()` and ensure that `reserved_bytes` aligns closely with `allocated_bytes`, and verify that `torch.cuda.memory_stats()['num_alloc_retries']` remains at 0 under prolonged high-concurrency training.",
    "date": "2026-08-21",
    "id": 1787273068,
    "type": "error"
});