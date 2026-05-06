window.onPostDataLoaded({
    "title": "Fix PyTorch DDP Deadlocks in Heterogeneous Clusters",
    "slug": "pytorch-ddp-heterogeneous-deadlocks",
    "language": "Python",
    "code": "NCCLTimeoutError",
    "tags": [
        "Python",
        "Backend",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) in PyTorch relies on the NCCL backend for collective communication (like All-Reduce). In heterogeneous GPU clusters\u2014where nodes have different GPU architectures (e.g., A100 mixed with V100) or varying VRAM\u2014deadlocks occur because DDP assumes synchronized execution. If one process finishes its compute step significantly faster or slower due to hardware disparity, the NCCL barrier times out, often resulting in a hard hang of the entire training job rather than a clean exception.</p>",
    "root_cause": "Skewed computation times between nodes lead to desynchronized entries into the NCCL collective communication primitives, triggering a watchdog timeout or a permanent block.",
    "bad_code": "import torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\n# Standard init without consideration for hardware lag\ndist.init_process_group(backend='nccl')\nmodel = DDP(model, device_ids=[local_rank])",
    "solution_desc": "Set an explicit 'timeout' in the 'init_process_group' call and use 'NCCL_ASYNC_ERROR_HANDLING' environment variables. Additionally, use 'find_unused_parameters=False' to reduce overhead and manually balance the workload if GPU compute power is non-uniform.",
    "good_code": "import datetime\nimport os\n\nos.environ[\"NCCL_ASYNC_ERROR_HANDLING\"] = \"1\"\n\ndist.init_process_group(\n    backend='nccl', \n    timeout=datetime.timedelta(seconds=1800),\n    init_method='env://'\n)\nmodel = DDP(model, device_ids=[local_rank], gradient_as_bucket_view=True)",
    "verification": "Monitor NCCL logs by setting 'export NCCL_DEBUG=INFO' and verify that the 'timeout' parameter allows the process to crash and restart rather than hanging indefinitely.",
    "date": "2026-05-06",
    "id": 1778054923,
    "type": "error"
});