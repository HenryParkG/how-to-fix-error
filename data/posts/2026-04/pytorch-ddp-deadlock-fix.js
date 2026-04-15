window.onPostDataLoaded({
    "title": "Mitigating PyTorch DDP Deadlocks in Heterogeneous Clusters",
    "slug": "pytorch-ddp-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>PyTorch DistributedDataParallel (DDP) relies on collective communication (NCCL/Gloo). In heterogeneous clusters where GPUs have varying speeds or network latencies, deadlocks occur if one process (rank) fails to reach an 'all_reduce' synchronization point. This is common when using conditional logic in the forward pass or when one rank encounters a data-loading exception while others proceed to the gradient synchronization step.</p>",
    "root_cause": "Desynchronization of collective communication calls across different ranks, usually due to branching logic or unhandled exceptions in the training loop.",
    "bad_code": "def train_step(model, data, rank):\n    output = model(data)\n    if rank == 0 and some_condition:\n        # If Rank 0 enters here but others don't, NCCL will hang\n        loss = compute_extra_loss(output)\n    loss.backward()\n    optimizer.step()",
    "solution_desc": "Implement explicit timeouts, use 'dist.barrier()' to sync ranks, and ensure 'find_unused_parameters=True' if some model branches are not executed. Wrap the loop in a try-except block that calls 'dist.destroy_process_group()' on failure.",
    "good_code": "from torch.nn.parallel import DistributedDataParallel as DDP\nimport torch.distributed as dist\n\nmodel = DDP(base_model, device_ids=[rank], find_unused_parameters=True)\n\ntry:\n    dist.barrier() # Ensure all ranks are ready\n    output = model(data)\n    loss = criterion(output, target)\n    loss.backward()\n    optimizer.step()\nexcept Exception as e:\n    dist.destroy_process_group()\n    raise e",
    "verification": "Set the environment variable 'NCCL_ASYNC_ERROR_HANDLING=1' and 'TORCH_DISTRIBUTED_DEBUG=DETAIL' to log the exact rank and collective that timed out.",
    "date": "2026-04-15",
    "id": 1776237575,
    "type": "error"
});