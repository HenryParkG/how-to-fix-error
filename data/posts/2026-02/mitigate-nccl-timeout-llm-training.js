window.onPostDataLoaded({
    "title": "Mitigating NCCL Collective Timeouts in LLM Training",
    "slug": "mitigate-nccl-timeout-llm-training",
    "language": "Python",
    "code": "NCCL_TIMEOUT",
    "tags": [
        "Python",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In distributed multi-node LLM training, NCCL (NVIDIA Collective Communications Library) timeouts often manifest as cryptic 'Watchdog' errors or hung processes during the <code>all_reduce</code> phase. These failures are typically triggered by network jitter, inconsistent GPU clock speeds across nodes, or CPU-side bottlenecks that prevent timely participation in collective operations. When one node lags, the entire ring waits, eventually exceeding the default 30-minute timeout window.</p>",
    "root_cause": "The root cause is usually a combination of 'NCCL_SOCKET_IFNAME' misconfiguration causing traffic to route over slow interfaces, and the lack of 'NCCL_ASYNC_ERROR_HANDLING' causing the training loop to hang indefinitely rather than failing fast and recovering.",
    "bad_code": "import torch.distributed as dist\n\n# Basic initialization without error handling or timeout tuning\ndist.init_process_group(\n    backend='nccl',\n    init_method='env://',\n    world_size=64,\n    rank=my_rank\n)",
    "solution_desc": "Set NCCL-specific environment variables to force the correct network interface and enable asynchronous error handling. Additionally, provide an explicit, shorter timeout duration and implement a robust initialization check to ensure all nodes are reachable before starting the compute-heavy loop.",
    "good_code": "import os\nimport datetime\nimport torch.distributed as dist\n\n# Force high-speed interface (e.g., Infiniband or 100G Eth)\nos.environ['NCCL_SOCKET_IFNAME'] = 'eth0'\nos.environ['NCCL_ASYNC_ERROR_HANDLING'] = '1'\nos.environ['NCCL_IB_DISABLE'] = '0'  # Enable IB if available\n\ndist.init_process_group(\n    backend='nccl',\n    timeout=datetime.timedelta(seconds=1800),\n    init_method='env://',\n    world_size=64,\n    rank=my_rank\n)",
    "verification": "Run the training script with 'NCCL_DEBUG=INFO' and verify that 'ncclNet' logs show the correct interface and that 'all_reduce' operations complete within the expected latency profile.",
    "date": "2026-02-23",
    "id": 1771809436,
    "type": "error"
});