window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA OOM from Caching Allocator Fragmentation",
    "slug": "fixing-pytorch-cuda-oom-caching-allocator-fragmentation",
    "language": "Python",
    "code": "CUDA out of memory",
    "tags": [
        "Python",
        "PyTorch",
        "CUDA",
        "Machine Learning",
        "Error Fix"
    ],
    "analysis": "<p>PyTorch employs a caching allocator to speed up memory allocations on the GPU. Instead of calling expensive CUDA memory allocation operations (<code>cudaMalloc</code>) on every tensor initialization, it retains previously freed allocations in a memory pool for rapid reuse. However, under heterogeneous workloads involving dynamic tensor shapes\u2014such as Natural Language Processing models with varying sequence lengths\u2014this pool can become highly fragmented.</p><p>As blocks of varying sizes are allocated and freed, the allocator splits contiguous free chunks into smaller pieces. Over time, the heap becomes populated with small, uncoalesced blocks. When PyTorch tries to allocate a large contiguous tensor (e.g., during attention calculations or gradient backpropagation), the caching allocator may find that while the aggregate free GPU memory is technically sufficient, no single contiguous block of the requested size exists. This triggers a spurious Out Of Memory (OOM) crash despite ample 'free' memory reporting in monitoring tools.</p>",
    "root_cause": "The caching allocator splits large contiguous blocks into smaller sub-blocks to satisfy minor tensor allocations. Because these sub-blocks are not merged back together until the entire pool is reclaimed, the memory pool becomes heavily fragmented, preventing the allocation of large, contiguous memory chunks.",
    "bad_code": "import torch\nimport os\n\n# Classic unoptimized training loop with dynamic input shapes\ndef train_epoch(model, dataloader, optimizer):\n    for batch in dataloader:\n        # Dynamic input shapes cause the allocator to generate wild variations in tensor sizes\n        inputs, targets = batch['input_ids'].cuda(), batch['labels'].cuda()\n        \n        outputs = model(inputs)\n        loss = criterion(outputs, targets)\n        \n        loss.backward()\n        optimizer.step()\n        optimizer.zero_grad() # Leaves gradient tensor slots allocated but empty",
    "solution_desc": "Configure the caching allocator via the environmental variable `PYTORCH_CUDA_ALLOC_CONF`. By setting `max_split_size_mb`, we prevent the allocator from splitting blocks larger than the specified threshold, which avoids severe fragmentation. Additionally, we optimize the training loop by setting gradients to `None` (which completely frees tensor memory rather than leaving empty tensors) and using mixed precision to reduce the memory footprint.",
    "good_code": "import os\nimport torch\n\n# Set allocator configuration before initial CUDA call to prevent large block splitting\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"max_split_size_mb:128,garbage_collection_threshold:0.8\"\n\ndef train_epoch_optimized(model, dataloader, optimizer, criterion):\n    # Set to none instead of zero to immediately deallocate gradients\n    optimizer.zero_grad(set_to_none=True)\n    \n    for batch in dataloader:\n        inputs, targets = batch['input_ids'].cuda(), batch['labels'].cuda()\n        \n        # Use Automatic Mixed Precision (AMP) to halve memory footprint\n        with torch.cuda.amp.autocast():\n            outputs = model(inputs)\n            loss = criterion(outputs, targets)\n            \n        loss.backward()\n        optimizer.step()\n        optimizer.zero_grad(set_to_none=True)\n        \n        # Explicitly remove local references to prevent scoped block leaks\n        del outputs, loss",
    "verification": "Run the training script and monitor the allocator behavior using `print(torch.cuda.memory_summary(device=None, abbreviated=False))`. Verify that the segment splitting pattern remains stable and that the 'Inactive Split' memory stays near zero bytes throughout processing.",
    "date": "2026-06-06",
    "id": 1780711941,
    "type": "error"
});