window.onPostDataLoaded({
    "title": "Resolving PyTorch NCCL Collective Timeouts",
    "slug": "pytorch-nccl-timeout-fix",
    "language": "Python",
    "code": "RuntimeError: NCCL Error 2",
    "tags": [
        "Python",
        "Backend",
        "Machine Learning",
        "Error Fix"
    ],
    "analysis": "<p>In multi-node distributed training using PyTorch's DistributedDataParallel (DDP), the NCCL backend is the gold standard for performance. However, it is notoriously sensitive to network configuration. Collective timeouts often occur when there is a mismatch in network interface names across nodes, firewall blocks on ephemeral ports, or when one node experiences a hardware-level slowdown (straggler), causing the entire synchronous collective (like AllReduce) to hang and eventually time out after the default 30-minute window.</p>",
    "root_cause": "Network interface ambiguity or desynchronized process arrivals at the synchronization barrier during collective operations.",
    "bad_code": "import torch.distributed as dist\n\n# Standard init often fails in complex VPCs\ndist.init_process_group(backend='nccl')\n# Training loop hangs here on node 1 while node 0 is ready",
    "solution_desc": "Explicitly define the network interface using environment variables and increase the heartbeat/timeout threshold. Use NCCL_DEBUG=INFO to identify if the hang is at the socket or plugin level.",
    "good_code": "import os\nimport torch.distributed as dist\nfrom datetime import timedelta\n\nos.environ['NCCL_SOCKET_IFNAME'] = 'eth0' # Force specific interface\nos.environ['NCCL_DEBUG'] = 'INFO'\n\ndist.init_process_group(\n    backend='nccl',\n    init_method='env://',\n    timeout=timedelta(minutes=60) # Increase for large clusters\n)",
    "verification": "Check logs for 'NCCL INFO NET/Socket' to confirm successful interface binding and monitor 'active_addr' in the logs.",
    "date": "2026-04-17",
    "id": 1776390360,
    "type": "error"
});