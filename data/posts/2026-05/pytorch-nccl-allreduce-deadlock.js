window.onPostDataLoaded({
    "title": "Mitigating NCCL All-Reduce Deadlocks in PyTorch",
    "slug": "pytorch-nccl-allreduce-deadlock",
    "language": "Python",
    "code": "NCCL_TIMEOUT",
    "tags": [
        "Python",
        "PyTorch",
        "MLOps",
        "Distributed",
        "Error Fix"
    ],
    "analysis": "<p>Multi-node training often suffers from NCCL deadlocks during All-Reduce operations. This typically occurs when one node experiences a minor hardware delay or network jitter, causing other nodes to wait indefinitely for a collective operation that never synchronizes. Without explicit timeouts and error handling, the entire training cluster hangs, wasting GPU resources.</p>",
    "root_cause": "The default NCCL environment lacks aggressive error handling and synchronization timeouts, causing ranks to hang forever if a single process fails to reach the barrier due to stragglers.",
    "bad_code": "import torch.distributed as dist\ndist.init_process_group(\"nccl\")\n# Standard training loop without heartbeat or timeout handles\noutput = model(input)\nloss = criterion(output, target)\nloss.backward()",
    "solution_desc": "Set NCCL_ASYNC_ERROR_HANDLING to 1 and configure NCCL_BLOCKING_WAIT to ensure failures are caught. Also, wrap the training loop in a watchdog that can trigger a checkpoint and restart upon detecting a hang.",
    "good_code": "import os\nos.environ[\"NCCL_ASYNC_ERROR_HANDLING\"] = \"1\"\nos.environ[\"NCCL_BLOCKING_WAIT\"] = \"1\"\n# Initialize with an explicit timeout duration\ndist.init_process_group(\"nccl\", timeout=datetime.timedelta(seconds=1800))",
    "verification": "Simulate a network drop on one node; verify that remaining nodes throw a TimeoutError instead of hanging indefinitely.",
    "date": "2026-05-11",
    "id": 1778480955,
    "type": "error"
});