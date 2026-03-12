window.onPostDataLoaded({
    "title": "Solving PyTorch DDP Deadlocks in Multi-Node Training",
    "slug": "pytorch-ddp-multi-node-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "PyTorch",
        "AI",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) deadlocks typically occur during the gradient reduction phase in multi-node setups. The most common manifestation is a 'Collective Timeout' where some ranks wait indefinitely for a synchronization primitive (like all_reduce) that other ranks never reach. This is often exacerbated by inconsistent batch sizes or conditional logic that prevents certain parameters from participating in the backward pass.</p>",
    "root_cause": "A mismatch in the set of parameters being updated across different ranks, or ranks entering the communication hook at different times due to data sharding imbalances.",
    "bad_code": "def train():\n    # ERROR: Conditional participation causes deadlock\n    output = model(input)\n    if rank == 0:\n        loss = criterion(output, target)\n        loss.backward() # Ranks > 0 never call backward, causing others to hang\n    optimizer.step()",
    "solution_desc": "Ensure all ranks execute the forward and backward passes. If some parameters are intentionally skipped, use the 'find_unused_parameters=True' flag in the DDP constructor, or use the 'model.join()' context manager to handle uneven inputs across ranks.",
    "good_code": "model = DistributedDataParallel(model, device_ids=[rank], find_unused_parameters=True)\n\nwith model.join(): # Handles uneven data shards across nodes\n    output = model(input)\n    loss = criterion(output, target)\n    loss.backward()\n    optimizer.step()",
    "verification": "Enable debug logging with 'export TORCH_DISTRIBUTED_DEBUG=DETAIL' and verify that all nodes complete the epoch without timing out.",
    "date": "2026-03-12",
    "id": 1773290571,
    "type": "error"
});