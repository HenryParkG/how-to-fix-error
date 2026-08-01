window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP CUDA Memory Fragmentation",
    "slug": "fixing-pytorch-ddp-cuda-memory-fragmentation",
    "language": "Python / PyTorch",
    "code": "CUDA Out of Memory",
    "tags": [
        "PyTorch",
        "CUDA",
        "Python",
        "Distributed",
        "Error Fix"
    ],
    "analysis": "<p>During large language model or vision transformer training with PyTorch DistributedDataParallel (DDP), gradient accumulation is routinely used to emulate large global batch sizes. However, when dynamic sequence lengths or variable-sized input tensors are passed through multiple accumulation steps, PyTorch's default caching allocator splits and reallocates memory blocks unpredictably. Over time, this causes severe CUDA memory allocation fragmentation. Even when total free VRAM appears sufficient, the allocator fails to find a contiguous block of memory for new activations or gradient tensors, triggering a catastrophic <code>torch.cuda.OutOfMemoryError</code>.</p>",
    "root_cause": "The PyTorch CUDA caching allocator splits memory blocks dynamically. When DDP performs gradient synchronization across iterations while variable-sized tensors are continuously allocated and freed during accumulation steps without calling ddp.no_sync(), allocator block boundaries fragment, isolating unallocated memory into small non-contiguous segments.",
    "bad_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\n# Buggy Gradient Accumulation in DDP\nmodel = DDP(MyLargeModel().cuda())\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)\n\naccumulation_steps = 8\nfor i, (inputs, targets) in enumerate(dataloader):\n    inputs, targets = inputs.cuda(), targets.cuda()\n    \n    # PROBLEM: DDP synchronizes gradients on EVERY backward pass,\n    # allocating gradient buffers continuously and fragmenting CUDA memory.\n    outputs = model(inputs)\n    loss = criterion(outputs, targets) / accumulation_steps\n    loss.backward()\n    \n    if (i + 1) % accumulation_steps == 0:\n        optimizer.step()\n        optimizer.zero_grad()",
    "solution_desc": "To eliminate memory fragmentation during gradient accumulation, use the context manager `model.no_sync()` for intermediate steps to prevent DDP from prematurely allocating reduction buffers. Furthermore, configure the environment variable `PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128` to prevent the allocator from splitting large contiguous blocks into tiny unrecoverable chunks.",
    "good_code": "import os\nimport torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\n# Fix 1: Configure PyTorch Allocator before initialization\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"max_split_size_mb:128\"\n\nmodel = DDP(MyLargeModel().cuda())\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)\naccumulation_steps = 8\n\noptimizer.zero_grad()\nfor i, (inputs, targets) in enumerate(dataloader):\n    inputs, targets = inputs.cuda(), targets.cuda()\n    \n    # Fix 2: Disable gradient synchronization during accumulation steps\n    is_accumulating = (i + 1) % accumulation_steps != 0\n    context = model.no_sync() if is_accumulating else torch.enable_grad()\n    \n    with context:\n        outputs = model(inputs)\n        loss = criterion(outputs, targets) / accumulation_steps\n        loss.backward()\n    \n    if not is_accumulating:\n        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)\n        optimizer.step()\n        optimizer.zero_grad()",
    "verification": "Verify by monitoring memory fragmentation via `torch.cuda.memory_summary()`. Ensure `allocated_bytes.all.current` closely tracks `reserved_bytes.all.current` and no `OutOfMemoryError` occurs during long training runs with dynamic batch lengths.",
    "date": "2026-08-01",
    "id": 1785580072,
    "type": "error"
});