window.onPostDataLoaded({
    "title": "Fix PyTorch CUDA Fragmentation & Graph Detach Leaks",
    "slug": "pytorch-cuda-memory-fragmentation-tensor-graph-detach-leaks",
    "language": "Python",
    "code": "CUDA Out Of Memory",
    "tags": [
        "Python",
        "PyTorch",
        "CUDA",
        "Error Fix"
    ],
    "analysis": "<p>PyTorch training loops frequently fail with <code>CUDA out of memory</code> errors even when batch sizes seem appropriate. This occurs due to two compounding factors: accumulating loss tensors without detaching them from the computational graph (retaining the full autograd history across all iterations), and severe memory fragmentation within the CUDA Caching Allocator caused by dynamic tensor allocations of fluctuating shapes.</p>",
    "root_cause": "Aggregating un-detached scalar tensors (e.g., `total_loss += loss`) keeps dynamic computation graphs in GPU memory across iterations, while variable-length sequence batches cause the caching allocator to split and fragment virtual memory blocks.",
    "bad_code": "import torch\n\ndef train_epoch(model, dataloader, optimizer, criterion):\n    model.train()\n    total_loss = 0.0  # Accumulates computation graph nodes\n    \n    for batch_idx, (inputs, targets) in enumerate(dataloader):\n        inputs, targets = inputs.cuda(), targets.cuda()\n        optimizer.zero_grad()\n        outputs = model(inputs)\n        loss = criterion(outputs, targets)\n        loss.backward()\n        optimizer.step()\n        \n        # BUG: Retains entire autograd graph in memory\n        total_loss += loss \n        \n    return total_loss / len(dataloader)",
    "solution_desc": "Isolate metric values using `.item()` or `.detach()` to sever computation graphs. Address allocator fragmentation by enabling `expandable_segments:True` in `PYTORCH_CUDA_ALLOC_CONF` and standardizing batch tensor dimensions.",
    "good_code": "import os\nimport torch\n\n# Configure allocator to reduce virtual memory fragmentation\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True\"\n\ndef train_epoch(model, dataloader, optimizer, criterion):\n    model.train()\n    total_loss = 0.0\n    \n    for batch_idx, (inputs, targets) in enumerate(dataloader):\n        inputs = inputs.cuda(non_blocking=True)\n        targets = targets.cuda(non_blocking=True)\n        \n        optimizer.zero_grad(set_to_none=True)\n        outputs = model(inputs)\n        loss = criterion(outputs, targets)\n        loss.backward()\n        optimizer.step()\n        \n        # FIX: Extract native Python float, freeing intermediate tensors\n        total_loss += loss.item()\n        \n    return total_loss / len(dataloader)",
    "verification": "Run a multi-epoch training pass and evaluate GPU memory stability using `torch.cuda.memory_allocated()` and `torch.cuda.memory_summary(device=None, abbreviated=False)`.",
    "date": "2026-08-22",
    "id": 1787390366,
    "type": "error"
});