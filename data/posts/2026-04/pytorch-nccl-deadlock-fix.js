window.onPostDataLoaded({
    "title": "Fixing NCCL Ring-Search Deadlocks",
    "slug": "pytorch-nccl-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "AWS",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>During multi-node PyTorch training using the DistributedDataParallel (DDP) wrapper, the NCCL backend performs a 'ring-search' to establish communication paths. If nodes have multiple network interfaces (e.g., eth0, lo, docker0), NCCL might attempt to bind to an internal virtual bridge that cannot route to other nodes, causing the process to hang indefinitely during the handshake phase.</p>",
    "root_cause": "NCCL fails to automatically identify the correct routable network interface in complex VPC or containerized environments, leading to asymmetric connection attempts.",
    "bad_code": "import torch.distributed as dist\n# This hangs on multi-node setups without explicit environment variables\ndist.init_process_group(backend='nccl')\nmodel = DDP(model, device_ids=[local_rank])",
    "solution_desc": "Explicitly set the NCCL_SOCKET_IFNAME environment variable to point to the primary physical or high-speed interface (like 'eth0' or 'enp') and disable P2P if the topology is incompatible.",
    "good_code": "import os\nimport torch.distributed as dist\n\nos.environ['NCCL_SOCKET_IFNAME'] = 'eth0'\nos.environ['NCCL_P2P_DISABLE'] = '1' # Optional for non-NVLink setups\ndist.init_process_group(backend='nccl', init_method='env://')",
    "verification": "Check logs for 'NCCL INFO: Call to connect returned Connection refused' and ensure all nodes reach the 'NCCL INFO Ring 00' initialization step.",
    "date": "2026-04-13",
    "id": 1776045035,
    "type": "error"
});