window.onPostDataLoaded({
    "title": "PyTorch CUDA OOM & Mixed Precision Instability",
    "slug": "pytorch-cuda-oom-mixed-precision-instability",
    "language": "Python",
    "code": "CUDA_OOM_NaN",
    "tags": [
        "PyTorch",
        "Deep Learning",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>CUDA Out of Memory (OOM) errors frequently arise from caching allocator fragmentation and accidental retention of the computation graph across iterations. When calculating metrics such as running loss, assigning raw loss tensors (e.g., <code>total_loss += loss</code>) retains the entire directed acyclic graph (DAG) in device memory for all previous steps.</p><p>Simultaneously, using Automatic Mixed Precision (AMP) with float16 (FP16) without proper scaling produces gradient underflow or overflow. Small dynamic ranges cause low-magnitude gradients to flush to zero, while high activations yield <code>inf</code> or <code>NaN</code>, corrupting parameter updates and destabilizing the model weights during optimization.</p>",
    "root_cause": "Graph history retention across iterative training loops coupled with FP16 exponent range exhaustion in torch.cuda.amp without dynamic loss scaling.",
    "bad_code": "import torch\nimport torch.nn as nn\n\nmodel = nn.Linear(4096, 4096).cuda()\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)\ncriterion = nn.MSELoss()\n\ntotal_loss = 0.0\nfor x, y in dataloader:\n    optimizer.zero_grad()\n    # Unscaled FP16 leading to numerical instability and NaNs\n    with torch.cuda.amp.autocast(dtype=torch.float16):\n        out = model(x.cuda())\n        loss = criterion(out, y.cuda())\n    \n    loss.backward() # Unscaled gradients underflow\n    optimizer.step()\n    total_loss += loss # Leaks graph: retains autograd DAG over every batch iteration",
    "solution_desc": "Extract scalar floats from loss tensors using .item() to detach from the computation graph. Employ torch.cuda.amp.GradScaler to dynamically scale gradient magnitudes before backward passes, unscale before gradient clipping, and set parameter gradients to None during resets to reduce allocator fragmentation.",
    "good_code": "import torch\nimport torch.nn as nn\n\nmodel = nn.Linear(4096, 4096).cuda()\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)\ncriterion = nn.MSELoss()\nscaler = torch.cuda.amp.GradScaler()\n\ntotal_loss = 0.0\nfor x, y in dataloader:\n    optimizer.zero_grad(set_to_none=True)\n    \n    with torch.cuda.amp.autocast(dtype=torch.float16):\n        out = model(x.cuda(non_blocking=True))\n        loss = criterion(out, y.cuda(non_blocking=True))\n    \n    scaler.scale(loss).backward()\n    scaler.unscale_(optimizer)\n    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\n    \n    scaler.step(optimizer)\n    scaler.update()\n    \n    total_loss += loss.item() # Detached float prevents memory leaks",
    "verification": "Check memory allocation using 'torch.cuda.memory_allocated()' and 'torch.cuda.memory_reserved()'. Inspect 'scaler.get_scale()' to ensure dynamic scaling remains stable and does not decay to zero due to persistent NaNs.",
    "date": "2026-09-16",
    "id": 1789546592,
    "type": "error"
});