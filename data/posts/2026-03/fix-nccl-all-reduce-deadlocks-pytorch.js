window.onPostDataLoaded({
    "title": "Fix NCCL All-Reduce Deadlocks in PyTorch",
    "slug": "fix-nccl-all-reduce-deadlocks-pytorch",
    "language": "Python",
    "code": "NCCL_TIMEOUT",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In distributed deep learning, NCCL deadlocks occur when one process in a training rank fails to reach a collective communication barrier (like All-Reduce). This often happens due to uneven data shard sizes or silent network failures, causing the entire cluster to hang indefinitely without throwing an explicit error.</p>",
    "root_cause": "Mismatch in collective operations across ranks or unhandled network timeouts in the NCCL backend.",
    "bad_code": "import torch.distributed as dist\n\n# No timeout specified, defaults to 30 minutes or infinite\ndist.init_process_group(backend='nccl')\n\n# If one rank fails here, others wait forever\ndist.all_reduce(tensor)",
    "solution_desc": "Set an explicit, shorter timeout during initialization and enable asynchronous error handling via environment variables to allow the process to crash and restart from a checkpoint rather than hanging.",
    "good_code": "import os\nfrom datetime import timedelta\nimport torch.distributed as dist\n\nos.environ[\"NCCL_ASYNC_ERROR_HANDLING\"] = \"1\"\n\ndist.init_process_group(\n    backend='nccl', \n    timeout=timedelta(seconds=1800)\n)",
    "verification": "Check logs for 'NCCL Watchdog' timeout exceptions and ensure the training job terminates rather than idling at 0% GPU utility.",
    "date": "2026-03-22",
    "id": 1774161585,
    "type": "error"
});