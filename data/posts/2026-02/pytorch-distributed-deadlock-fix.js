window.onPostDataLoaded({
    "title": "PyTorch: Fixing Distributed Deadlocks",
    "slug": "pytorch-distributed-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Distributed training in PyTorch using the NCCL backend often encounters collective communication deadlocks. This typically happens when one rank (GPU) fails to reach a collective operation (like all_reduce or barrier) while others wait indefinitely. This is common in heterogeneous environments or when using uneven data splits across ranks.</p>",
    "root_cause": "A mismatch in the sequence of collective operations across different ranks, or a silent failure in one node that prevents it from reaching the synchronization point, causing the entire cluster to hang.",
    "bad_code": "def train(rank, world_size):\n    dist.init_process_group(\"nccl\", rank=rank, world_size=world_size)\n    if rank == 0:\n        # Some rank-specific heavy logic\n        do_expensive_op()\n    # Deadlock if rank 0 is late or fails\n    dist.all_reduce(tensor)",
    "solution_desc": "Set an explicit 'timeout' in 'init_process_group' and enable 'NCCL_ASYNC_ERROR_HANDLING'. Use 'join()' context managers for DistributedDataParallel to handle uneven inputs across ranks gracefully.",
    "good_code": "import datetime\ndist.init_process_group(\n    backend=\"nccl\",\n    timeout=datetime.timedelta(seconds=1800),\n    init_method=\"env://\"\n)\n# Use Join context for uneven data\nwith model.join():\n    optimizer.step()",
    "verification": "Set export NCCL_DEBUG=INFO and NCCL_ASYNC_ERROR_HANDLING=1 to log and catch timeout exceptions in the training loop.",
    "date": "2026-02-16",
    "id": 1771235200,
    "type": "error"
});