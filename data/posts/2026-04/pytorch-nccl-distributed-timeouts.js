window.onPostDataLoaded({
    "title": "Resolving PyTorch NCCL Collective Communication Timeouts",
    "slug": "pytorch-nccl-distributed-timeouts",
    "language": "Python",
    "code": "NCCLTimeout",
    "tags": [
        "Python",
        "AWS",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Multi-node distributed training in PyTorch using the NCCL backend is highly performant but sensitive to network configuration. Timeouts typically manifest during the <code>dist.init_process_group</code> call or during the first <code>all_reduce</code> operation in the training loop. This happens because the nodes fail to synchronize within the default 30-minute window.</p><p>In cloud environments like AWS or GCP, the primary culprit is often an ambiguous network interface selection. NCCL might attempt to communicate over a secondary virtual interface (like <code>docker0</code>) that lacks routing to other nodes, rather than the primary high-speed fabric (like <code>eth0</code> or <code>efa0</code>).</p>",
    "root_cause": "The root cause is usually a network topology mismatch or blocked ports (12345 by default) where nodes cannot establish a TCP handshake for the NCCL control plane, or the wrong network interface is automatically selected by NCCL.",
    "bad_code": "import torch.distributed as dist\nimport os\n\ndef setup():\n    # Fails if nodes can't find each other or use wrong interface\n    dist.init_process_group(backend=\"nccl\")\n    # Training loop starts...",
    "solution_desc": "Explicitly set the <code>NCCL_SOCKET_IFNAME</code> environment variable to your primary network interface and increase the <code>timeout</code> parameter in the initialization. Additionally, ensure the Master Address is reachable across all subnets.",
    "good_code": "import torch.distributed as dist\nimport os\nfrom datetime import timedelta\n\ndef setup():\n    # Force NCCL to use a specific interface (e.g., eth0)\n    os.environ[\"NCCL_SOCKET_IFNAME\"] = \"eth0\"\n    os.environ[\"NCCL_DEBUG\"] = \"INFO\" # Useful for debugging\n    \n    dist.init_process_group(\n        backend=\"nccl\",\n        init_method=\"env://\",\n        timeout=timedelta(minutes=60) # Increased for large model setup\n    )",
    "verification": "Check logs for 'NCCL INFO NET/Socket : Using [interface]'. Successful verification occurs when all ranks log 'Connected to rank 0' and training commences.",
    "date": "2026-04-10",
    "id": 1775805481,
    "type": "error"
});