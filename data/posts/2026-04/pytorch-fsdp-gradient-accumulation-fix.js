window.onPostDataLoaded({
    "title": "Resolving PyTorch FSDP Sharded State Inconsistencies",
    "slug": "pytorch-fsdp-gradient-accumulation-fix",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>When using PyTorch's Fully Sharded Data Parallel (FSDP) with gradient accumulation, developers often encounter sharded state inconsistencies. This typically manifests as a mismatch between the expected and actual gradient shapes or values during the <code>optimizer.step()</code> call. The issue stems from FSDP's automatic gradient reduction which, by default, attempts to synchronize and unshard parameters at every backward pass, even during micro-batching steps where synchronization should be deferred.</p>",
    "root_cause": "Failure to use the <code>no_sync()</code> context manager during intermediate gradient accumulation steps, causing redundant and premature gradient reductions across GPU ranks.",
    "bad_code": "for i, (inputs, target) in enumerate(dataloader):\n    output = model(inputs)\n    loss = criterion(output, target) / accumulation_steps\n    loss.backward() # Error: Syncs gradients on every micro-batch\n    if (i + 1) % accumulation_steps == 0:\n        optimizer.step()\n        optimizer.zero_grad()",
    "solution_desc": "Wrap all micro-batch backward passes except the final one in the <code>model.no_sync()</code> context manager. This disables the expensive and disruptive all-reduce operations until the accumulation period is complete.",
    "good_code": "for i, (inputs, target) in enumerate(dataloader):\n    context = model.no_sync() if (i + 1) % accumulation_steps != 0 else contextlib.nullcontext()\n    with context:\n        output = model(inputs)\n        loss = criterion(output, target) / accumulation_steps\n        loss.backward()\n\nif (i + 1) % accumulation_steps == 0:\n    optimizer.step()\n    optimizer.zero_grad()",
    "verification": "Check the GPU logs for reduced NCCL communication overhead and verify that loss curves match single-GPU execution with equivalent global batch sizes.",
    "date": "2026-04-07",
    "id": 1775525188,
    "type": "error"
});