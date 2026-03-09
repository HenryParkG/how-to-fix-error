window.onPostDataLoaded({
    "title": "Diagnosing PyTorch Multi-Node Deadlocks",
    "slug": "pytorch-multi-node-deadlocks",
    "language": "Python",
    "code": "CollectiveDeadlock",
    "tags": [
        "Python",
        "PyTorch",
        "Distributed",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Collective communication operations like <code>dist.all_reduce</code> or <code>dist.barrier</code> require every participating rank in a process group to enter the call. If a single rank hits an exception, exits early, or enters a different branch of logic, all other nodes will wait indefinitely for the missing rank, causing a cluster-wide deadlock.</p><p>This is common in multi-node setups where network partitions or heterogeneous compute speeds cause desynchronization.</p>",
    "root_cause": "Conditional logic resulting in mismatched collective communication calls across different distributed ranks.",
    "bad_code": "import torch.distributed as dist\n\ndef train(rank):\n    if rank == 0:\n        # Rank 0 performs a collective op\n        dist.all_reduce(tensor)\n    else:\n        # Other ranks skip it, causing Rank 0 to hang\n        pass",
    "solution_desc": "Ensure all collective operations are reached by all ranks simultaneously. Use timeouts and environment variables like NCCL_DEBUG to identify which rank is lagging.",
    "good_code": "import torch.distributed as dist\n\ndef train(rank):\n    # Ensure ALL ranks participate in the collective operation\n    dist.all_reduce(tensor)\n    # Or use a synchronization barrier to align ranks\n    dist.barrier()",
    "verification": "Set `export NCCL_DEBUG=INFO` and `export TORCH_DISTRIBUTED_DEBUG=DETAIL` to monitor communication state and log timeouts.",
    "date": "2026-03-09",
    "id": 1773049190,
    "type": "error"
});