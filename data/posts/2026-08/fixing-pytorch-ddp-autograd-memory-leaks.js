window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Autograd Memory Leaks in Distributed LLMs",
    "slug": "fixing-pytorch-ddp-autograd-memory-leaks",
    "language": "Python / PyTorch",
    "code": "CUDA OOM",
    "tags": [
        "PyTorch",
        "LLM",
        "Distributed",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>During large-scale distributed LLM training using PyTorch DistributedDataParallel (DDP), GPU memory usage can mysteriously grow lineally over training steps until a CUDA Out Of Memory (OOM) error occurs. This issue is notoriously difficult to trace because model weights and batch sizes remain constant.</p><p>The root cause stems from inadvertently retaining references to PyTorch computation graph nodes across iterations. In DDP, tensors bound to `grad_fn` retain references to the autograd graph, intermediate activation caches, and cross-node communication hooks. Storing raw loss tensors in Python primitives (like lists) for logging without decoupling them from autograd prevents Python's Garbage Collector and PyTorch's C++ memory allocator from reclaiming memory.</p>",
    "root_cause": "Appending live loss objects (tensors attached to autograd history) into tracking lists or keeping unused output variables across model iterations causes PyTorch to retain the entire backward computation graph in VRAM.",
    "bad_code": "import torch\nimport torch.nn as nn\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef train_epoch(model, dataloader, optimizer):\n    model.train()\n    loss_history = []  # BUG: Holds dynamic references to computation graphs\n\n    for step, batch in enumerate(dataloader):\n        optimizer.zero_grad()\n        outputs = model(batch['input_ids'])\n        loss = outputs.loss\n        loss.backward()\n        optimizer.step()\n\n        # BUG: Storing non-detached tensor keeps autograd graph alive across loops\n        loss_history.append(loss) ",
    "solution_desc": "Always extract Python scalars from loss tensors using `.item()` or explicitly detach tensors from the computation graph with `.detach()` before storing or logging. For non-gradient steps or auxiliary computations in DDP, wrap operations in `torch.no_grad()` or use `model.no_sync()` context managers to prevent unneeded gradient bucket accumulations.",
    "good_code": "import torch\nimport torch.nn as nn\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef train_epoch(model, dataloader, optimizer):\n    model.train()\n    loss_history = []\n\n    for step, batch in enumerate(dataloader):\n        optimizer.zero_grad()\n        outputs = model(batch['input_ids'])\n        loss = outputs.loss\n        loss.backward()\n        optimizer.step()\n\n        # FIX: Extract scalar value to discard reference to the autograd graph\n        loss_history.append(loss.detach().item())\n\n        # Explicitly delete outputs if large activations linger in local scope\n        del outputs, loss",
    "verification": "Run training with `torch.cuda.memory_allocated()` printed at every step. Ensure memory usage stabilizes after initial iteration allocations and does not monotonically rise over 100+ training steps.",
    "date": "2026-08-06",
    "id": 1786014762,
    "type": "error"
});