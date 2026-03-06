window.onPostDataLoaded({
    "title": "Solving PyTorch DDP Deadlocks in Collective Comm",
    "slug": "pytorch-ddp-collective-deadlock",
    "language": "Python",
    "code": "CollectiveDeadlock",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) deadlocks frequently occur during collective communication calls like all_reduce or broadcast. This happens when the computation graph or data loading across different GPU ranks becomes desynchronized. If one rank finishes its loop iteration while others are still waiting for a gradient synchronization, the entire process hangs indefinitely without an explicit error message, as the NCCL/Gloo backend waits for a heartbeat from the missing rank.</p>",
    "root_cause": "Uneven dataset sizes across ranks or conditional logic inside the forward pass that bypasses specific layers on only a subset of ranks.",
    "bad_code": "def train():\n    for data, target in loader:\n        output = model(data)\n        loss = criterion(output, target)\n        # If one rank has fewer batches, others will hang here\n        loss.backward()\n        optimizer.step()",
    "solution_desc": "Use DistributedSampler with drop_last=True to ensure identical batch counts, and set find_unused_parameters=True if conditional branches exist in the model.",
    "good_code": "sampler = DistributedSampler(dataset, num_replicas=world_size, rank=rank, drop_last=True)\nloader = DataLoader(dataset, sampler=sampler)\n\nmodel = DistributedDataParallel(model, device_ids=[rank], find_unused_parameters=False)",
    "verification": "Set the environment variable TORCH_DISTRIBUTED_DEBUG=DETAIL to identify the specific collective call where ranks are diverging.",
    "date": "2026-03-06",
    "id": 1772779011,
    "type": "error"
});