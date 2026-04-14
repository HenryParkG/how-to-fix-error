window.onPostDataLoaded({
    "title": "Fixing NCCL All-Reduce Timeouts in Distributed LLM Training",
    "slug": "nccl-all-reduce-timeout-fix",
    "language": "Python",
    "code": "NCCL_TIMEOUT",
    "tags": [
        "Python",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Distributed training of Large Language Models (LLMs) often fails with 'NCCL connection timeout' during the All-Reduce step. This usually happens when one GPU node lags behind others due to thermal throttling, CPU-side bottlenecks, or network congestion on the interconnect (e.g., EFA or InfiniBand).</p><p>When the NCCL watchdog timer expires before all ranks reach the barrier, the entire training job crashes. Standard timeout values are often too short for the massive gradients of 70B+ parameter models.</p>",
    "root_cause": "Network jitter or straggler nodes causing ranks to reach the All-Reduce barrier asynchronously, exceeding the default NCCL_COMM_BLOCKING_WAIT timeout.",
    "bad_code": "import torch.distributed as dist\n\n# Default initialization with short timeout\ndist.init_process_group(\n    backend=\"nccl\",\n    init_method=\"env://\",\n    rank=rank,\n    world_size=world_size\n)",
    "solution_desc": "Increase the NCCL timeout duration, enable asynchronous error handling, and tune environment variables to bypass faulty P2P links or force specific network interfaces.",
    "good_code": "import os\nimport torch.distributed as dist\nfrom datetime import timedelta\n\n# Increase timeout to 30 minutes for large syncs\nos.environ[\"NCCL_BLOCKING_WAIT\"] = \"1\"\nos.environ[\"NCCL_ASYNC_ERROR_HANDLING\"] = \"1\"\n\ndist.init_process_group(\n    backend=\"nccl\",\n    timeout=timedelta(minutes=30),\n    rank=rank,\n    world_size=world_size\n)",
    "verification": "Check logs for 'NCCL INFO' to confirm all ranks are using the same network interface and monitor 'nccl_latency_ms' during training.",
    "date": "2026-04-14",
    "id": 1776161285,
    "type": "error"
});