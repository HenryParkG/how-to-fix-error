window.onPostDataLoaded({
    "title": "Resolving Collective Deadlocks in Tensor Parallelism",
    "slug": "tensor-parallelism-deadlock-fix",
    "language": "Python",
    "code": "NCCL Timeout",
    "tags": [
        "Python",
        "Backend",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In multi-node distributed training, tensor parallelism relies on collective communication (AllReduce, AllGather) via NCCL. Deadlocks occur when different ranks (GPUs) enter collective operations in a mismatched order or when one rank encounters a conditional logic branch that others do not. This causes the entire cluster to hang as nodes wait indefinitely for a synchronization primitive that will never arrive from a missing rank.</p>",
    "root_cause": "Circular dependency in the execution graph where Rank A waits for Rank B on an AllReduce call, while Rank B is stuck in a different collective operation or a blocking CPU-bound task.",
    "bad_code": "import torch.distributed as dist\n\ndef train_step(rank, tensor):\n    if rank == 0:\n        # BUG: Only rank 0 enters this, but all_reduce is a collective op\n        # requiring all ranks in the group to participate.\n        dist.all_reduce(tensor)\n    else:\n        compute_locally(tensor)",
    "solution_desc": "Ensure all collective operations are called globally across all ranks in the process group. Use distributed barriers and consistent branching logic. Implement NCCL_ASYNC_ERROR_HANDLING to catch timeouts early.",
    "good_code": "import torch.distributed as dist\n\ndef train_step(rank, tensor):\n    # All ranks must enter the collective operation\n    # even if they contribute a zero-tensor or dummy data.\n    dist.all_reduce(tensor, op=dist.ReduceOp.SUM)\n    \n    # Use barriers only when strictly necessary for sync\n    dist.barrier()\n    \n    if rank == 0:\n        log_master_stats(tensor)",
    "verification": "Enable 'export NCCL_DEBUG=INFO' and 'export TORCH_DISTRIBUTED_DEBUG=DETAIL' to log collective entry/exit points and identify the hanging rank.",
    "date": "2026-04-12",
    "id": 1775958363,
    "type": "error"
});