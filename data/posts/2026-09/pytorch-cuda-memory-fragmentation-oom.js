window.onPostDataLoaded({
    "title": "Resolving PyTorch CUDA Memory Fragmentation & OOM",
    "slug": "pytorch-cuda-memory-fragmentation-oom",
    "language": "Python",
    "code": "torch.cuda.OutOfMemoryError",
    "tags": [
        "Python",
        "PyTorch",
        "CUDA",
        "Deep Learning",
        "Error Fix"
    ],
    "analysis": "<p>PyTorch uses a caching memory allocator for CUDA operations to avoid the latency of frequent <code>cudaMalloc</code> and <code>cudaFree</code> calls. While this significantly speeds up tensor allocation, it can lead to severe virtual memory fragmentation, particularly in workloads with dynamic sequence lengths, variable batch sizes, or multi-modal architectures.</p><p>When PyTorch allocates memory blocks, it caches freed blocks in segments. If a subsequent tensor requires a continuous block larger than any available single unallocated contiguous space within those segments, the allocator requests new segments from the CUDA driver. Once total reserved memory hits the GPU physical limit, PyTorch throws a <code>torch.cuda.OutOfMemoryError</code>, even though <code>torch.cuda.memory_reserved() - torch.cuda.memory_allocated()</code> shows gigabytes of unused space.</p>",
    "root_cause": "CUDA memory fragmentation inside PyTorch's caching allocator caused by non-uniform tensor size requests, preventing reuse of smaller cached memory segments for larger contiguous allocations.",
    "bad_code": "import torch\nimport torch.nn as nn\n\ndef train_step(model, data_loader):\n    for batch in data_loader:\n        # Dynamic input shapes cause allocation blocks of varying sizes\n        inputs = batch['inputs'].cuda() # e.g., shape varies from [8, 128] to [8, 4096]\n        targets = batch['targets'].cuda()\n        \n        outputs = model(inputs)\n        loss = nn.functional.cross_entropy(outputs, targets)\n        loss.backward()\n        \n        # Unmanaged dynamic iterations accumulate fragmented blocks\n        # Eventually crashes: torch.cuda.OutOfMemoryError: CUDA out of memory",
    "solution_desc": "Enable the expandable segments feature in PyTorch's CUDA caching allocator configuration (`expandable_segments:True`). This instructs the allocator to use driver-level virtual memory management APIs (`cuMemCreate`, `cuMemMap`), allowing physical memory pages to be mapped non-contiguously to contiguous virtual addresses, completely preventing pool fragmentation.",
    "good_code": "import os\nimport torch\nimport torch.nn as nn\n\n# Configure allocator backend before initializing CUDA context\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True,max_split_size_mb:128\"\n\ndef train_step(model, data_loader, optimizer):\n    for batch in data_loader:\n        optimizer.zero_grad(set_to_none=True) # Frees gradient buffers directly\n        \n        inputs = batch['inputs'].to('cuda', non_blocking=True)\n        targets = batch['targets'].to('cuda', non_blocking=True)\n        \n        with torch.autocast(device_type='cuda', dtype=torch.bfloat16):\n            outputs = model(inputs)\n            loss = nn.functional.cross_entropy(outputs, targets)\n            \n        loss.backward()\n        optimizer.step()\n        \n        # Optional: bucket sequences to uniform lengths to further reduce reallocation",
    "verification": "Execute `torch.cuda.memory_summary()` and check that `reserved_bytes` closely tracks `allocated_bytes`. Verify that `cuda.memory_snapshot()` contains zero aborted continuous segment queries under high variance batch sizes.",
    "date": "2026-09-09",
    "id": 1788939767,
    "type": "error"
});