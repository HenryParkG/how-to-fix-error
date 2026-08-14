window.onPostDataLoaded({
    "title": "Fix PyTorch DDP Deadlocks in Heterogeneous Clusters",
    "slug": "pytorch-ddp-gradient-sync-deadlocks-heterogeneous",
    "language": "Python",
    "code": "NCCL Timeout",
    "tags": [
        "Python",
        "Docker",
        "Kubernetes",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>Training distributed deep learning models with PyTorch <code>DistributedDataParallel</code> (DDP) across heterogeneous compute environments (e.g., nodes mixing PCIe Gen4 and NVLink or variable CPU-GPU interconnect speeds) frequently causes gradient synchronization deadlocks.</p><p>DDP coalesces gradients into buckets and schedules all-reduce collective communications concurrently with the backward pass. When workers exhibit uneven backward pass durations due to heterogeneous hardware throughput or dynamic computation graphs with conditional layers, fast ranks trigger NCCL all-reduce operations while slow ranks are still computing. This causes ring/tree buffer starvation, mismatched collective communication ordering, and eventual NCCL watchdog timeouts.</p>",
    "root_cause": "Bucket-level gradient synchronization triggers out-of-order NCCL all-reduce ring operations when heterogeneous node execution latencies desynchronize backward pass completion times.",
    "bad_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef setup_ddp(model):\n    # Default bucket sizes and missing synchronization timeouts\n    dist.init_process_group(\n        backend=\"nccl\",\n        init_method=\"env://\"\n    )\n    # Dynamic parameters with static bucketing causes sync stalls\n    return DDP(model, find_unused_parameters=True)",
    "solution_desc": "Standardize gradient bucket sizes with `bucket_cap_mb`, set explicit communication timeouts, eliminate unnecessary graph traversals by setting `find_unused_parameters=False`, and configure NCCL environment variables to prevent collective desynchronization across heterogeneous ranks.",
    "good_code": "import os\nimport datetime\nimport torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef setup_ddp_heterogeneous(model):\n    os.environ[\"NCCL_BLOCKING_WAIT\"] = \"1\"\n    os.environ[\"NCCL_ASYNC_ERROR_HANDLING\"] = \"1\"\n    os.environ[\"TORCH_DISTRIBUTED_DEBUG\"] = \"DETAIL\"\n    \n    dist.init_process_group(\n        backend=\"nccl\",\n        init_method=\"env://\",\n        timeout=datetime.timedelta(minutes=30)\n    )\n    \n    # Tune bucket capacity to smaller sizes (e.g., 10-25MB) to reduce wait skew\n    return DDP(\n        model,\n        device_ids=[torch.cuda.current_device()],\n        bucket_cap_mb=15,\n        find_unused_parameters=False,\n        gradient_as_bucket_view=True\n    )",
    "verification": "Run training with `TORCH_DISTRIBUTED_DEBUG=DETAIL` and `NCCL_DEBUG=INFO`. Monitor that all ranks enter and complete all-reduce collective operations within uniform time windows without triggering `NCCL watchdog timeout` or rank divergence.",
    "date": "2026-08-14",
    "id": 1786669599,
    "type": "error"
});