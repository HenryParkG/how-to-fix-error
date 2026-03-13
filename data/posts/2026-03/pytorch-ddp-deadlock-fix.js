window.onPostDataLoaded({
    "title": "Resolving PyTorch DDP Deadlocks in Multi-Node Training",
    "slug": "pytorch-ddp-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError (Timeout)",
    "tags": [
        "Python",
        "Deep Learning",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) deadlocks typically occur when different training ranks reach synchronization points\u2014like collective communication operations or barriers\u2014at different times or not at all. In multi-node setups, if one rank encounters a Python exception or a CUDA OOM error while others continue, the remaining ranks will hang indefinitely waiting for the failed rank to check in.</p><p>This is exacerbated by the default NCCL backend behavior, which may not surface the root cause immediately, leaving developers with a generic 'Timeout' or a complete system freeze without logs from the failing node.</p>",
    "root_cause": "Unbalanced execution paths where one rank skips a collective communication call (like all_reduce) or fails silently, causing other ranks to block on the NCCL socket.",
    "bad_code": "import torch.distributed as dist\n\ndef train(rank, world_size):\n    dist.init_process_group(\"nccl\", rank=rank, world_size=world_size)\n    # Logic error: Only rank 0 performs a specific calculation\n    if rank == 0:\n        data = do_heavy_lifting()\n        dist.barrier() # Rank 0 waits here\n    else:\n        # Other ranks skip the heavy lifting but forget the barrier\n        pass\n    # Deadlock: Rank 0 waits for others who never call dist.barrier()",
    "solution_desc": "Implement symmetric control flows where every rank participates in every collective call. Additionally, enable the NCCL Async Error Handling and set explicit timeouts during process group initialization to ensure the job crashes cleanly with a traceback rather than hanging.",
    "good_code": "import torch.distributed as dist\nfrom datetime import timedelta\n\ndef train(rank, world_size):\n    # Enable async error handling for NCCL\n    dist.init_process_group(\n        \"nccl\", \n        rank=rank, \n        world_size=world_size,\n        timeout=timedelta(seconds=1800)\n    )\n    \n    # Symmetric sync: Every rank calls the barrier\n    if rank == 0:\n        data = do_heavy_lifting()\n    \n    dist.barrier() # All ranks reach this point together",
    "verification": "Run the training script with `export NCCL_DEBUG=INFO` and `export TORCH_DISTRIBUTED_DEBUG=DETAIL`. Verify that all ranks log entering and exiting the synchronization points.",
    "date": "2026-03-13",
    "id": 1773394320,
    "type": "error"
});