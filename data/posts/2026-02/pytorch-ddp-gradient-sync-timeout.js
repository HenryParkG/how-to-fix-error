window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Gradient Synchronization Timeouts",
    "slug": "pytorch-ddp-gradient-sync-timeout",
    "language": "Python",
    "code": "NCCL_TIMEOUT",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) relies on the NCCL backend for all-reduce operations. In large-scale training, processes may hang and time out if there is a load imbalance (one GPU finishes much faster than others) or if the computation graph changes between ranks (e.g., conditional logic that hides parameters from the gradient flow).</p>",
    "root_cause": "The default NCCL timeout (typically 30 minutes) is reached because one rank is delayed, or 'find_unused_parameters=True' is missing while having unused modules in the forward pass.",
    "bad_code": "dist.init_process_group(backend='nccl')\nmodel = DDP(model, device_ids=[rank])\n# Fails if some layers aren't used in every iteration",
    "solution_desc": "Explicitly set a longer timeout in the initialization and set 'find_unused_parameters' to True if your model architecture contains conditional branching.",
    "good_code": "from datetime import timedelta\ndist.init_process_group(\n    backend='nccl', \n    timeout=timedelta(minutes=60)\n)\nmodel = DDP(model, device_ids=[rank], find_unused_parameters=True)",
    "verification": "Monitor training logs; verify that the 'Watchdog' or 'NCCL' timeout errors no longer appear during the backward pass.",
    "date": "2026-02-25",
    "id": 1771982510,
    "type": "error"
});