window.onPostDataLoaded({
    "title": "Solving PyTorch DDP Deadlocks in Multi-Node Training",
    "slug": "pytorch-ddp-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError: NCCL Timeout",
    "tags": [
        "Python",
        "Backend",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) deadlocks frequently occur during multi-node training when one process rank enters a collective communication call (like all_reduce) that others never reach. This is common in scenarios with conditional logic in the forward pass or when using datasets with uneven sample distributions across ranks.</p>",
    "root_cause": "Mismatched execution paths across ranks where one rank finishes its loop early or skips a gradient synchronization step while others wait.",
    "bad_code": "def train():\n    for data in dataloader:\n        # If rank 0 has 10 batches and rank 1 has 9,\n        # rank 0 will wait forever for rank 1 on the 10th batch\n        outputs = model(data)\n        loss = loss_fn(outputs, targets)\n        loss.backward()\n        optimizer.step()",
    "solution_desc": "Use the `join()` context manager provided by PyTorch DDP to handle uneven inputs. This allows processes that finish early to remain 'active' and participate in the remaining collective communications required by other ranks.",
    "good_code": "from torch.nn.parallel import DistributedDataParallel as DDP\n\nmodel = DDP(model_instance, device_ids=[rank])\nwith model.join():\n    for data in dataloader:\n        optimizer.zero_grad()\n        outputs = model(data)\n        loss = loss_fn(outputs, targets)\n        loss.backward()\n        optimizer.step()",
    "verification": "Set `export NCCL_DEBUG=INFO` and verify that all ranks complete the final epoch without timing out.",
    "date": "2026-02-15",
    "id": 1771131001,
    "type": "error"
});