window.onPostDataLoaded({
    "title": "Mitigating PyTorch DDP Collective Deadlocks",
    "slug": "pytorch-ddp-communication-deadlocks",
    "language": "Python",
    "code": "DDP_DEADLOCK",
    "tags": [
        "PyTorch",
        "MLOps",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) relies on collective communication operations like AllReduce. A deadlock occurs when different ranks (GPUs) execute different code paths. If Rank 0 enters a conditional block containing a collective op while Rank 1 skips it, Rank 0 will wait indefinitely for Rank 1 to participate in the synchronization, hanging the entire training job.</p>",
    "root_cause": "Control flow divergence across ranks. Collective operations in NCCL or Gloo backends require participation from every rank in the process group in the exact same order.",
    "bad_code": "def train(rank, world_size):\n    # ... setup ...\n    if rank == 0:\n        # This causes all other ranks to hang\n        dist.all_reduce(tensor)\n    model(input)",
    "solution_desc": "Ensure that all ranks reach the collective communication call. If data is only present on one rank, use `dist.broadcast` or `dist.barrier` to keep ranks synchronized, or ensure the conditional logic is identical across all participating nodes.",
    "good_code": "def train(rank, world_size):\n    # All ranks must call all_reduce together\n    dist.all_reduce(tensor)\n    # If logic is conditional, ensure all ranks agree on the condition\n    if should_sync:\n        dist.all_reduce(tensor)",
    "verification": "Set the environment variable `NCCL_DEBUG=INFO` and `TORCH_DISTRIBUTED_DEBUG=DETAIL` to identify which rank is failing to reach the collective call.",
    "date": "2026-05-09",
    "id": 1778312612,
    "type": "error"
});