window.onPostDataLoaded({
    "title": "Debugging PyTorch DDP Collective Communication Deadlocks",
    "slug": "pytorch-ddp-nccl-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) relies on collective communication (like AllReduce) via backends like NCCL. Deadlocks occur when different ranks (GPUs) reach collective boundaries at different times or if one rank exits early due to an exception. Because collectives are blocking, if Rank 0 expects a gradient sync but Rank 1 is stuck in a data loading loop or a conditional branch, the entire training job hangs without a clear error message until the NCCL timeout is reached.</p>",
    "root_cause": "Divergent execution paths across ranks where one rank skips a collective operation (e.g., dist.all_reduce) that others have entered.",
    "bad_code": "if rank == 0 and condition:\n    # Only rank 0 enters, others hang waiting for rank 0\n    dist.all_reduce(tensor)\nelse:\n    train_model()",
    "solution_desc": "Ensure all ranks participate in every collective operation. Use the 'TORCH_DISTRIBUTED_DEBUG=DETAIL' environment variable to log desynchronization points and wrap collectives in synchronization barriers if logic is complex.",
    "good_code": "import torch.distributed as dist\n\n# Ensure uniform participation\ndist.barrier()\ndist.all_reduce(tensor)\n# Use broadcast to sync conditions instead of local branching\ndist.broadcast(condition_tensor, src=0)",
    "verification": "Set NCCL_DEBUG=INFO and verify that all ranks enter the 'ncclAllReduce' kernel simultaneously in the logs.",
    "date": "2026-05-15",
    "id": 1778826293,
    "type": "error"
});