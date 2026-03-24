window.onPostDataLoaded({
    "title": "Debugging NCCL Timeout Deadlocks in Multi-GPU Training",
    "slug": "pytorch-nccl-timeout-deadlock-fix",
    "language": "Python",
    "code": "NCCLTimeoutError",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Distributed training in PyTorch using the NCCL backend often encounters deadlocks where one process hangs while others wait at a collective communication barrier (like AllReduce). These timeouts are notoriously difficult to debug because the error message is often generic. They typically occur due to network jitter, inconsistent GPU memory states across nodes, or silent failures in one of the distributed processes that doesn't propagate quickly enough to the rest of the cluster.</p>",
    "root_cause": "Mismatch in collective communication calls between ranks or a hardware-level stall on a single GPU that causes the global sync to exceed the 'NCCL_TIMEOUT' threshold.",
    "bad_code": "import torch.distributed as dist\n\n# Basic init without robust error handling\ndist.init_process_group(backend='nccl')\n# If one rank skips this, all others hang\ndist.all_reduce(tensor)",
    "solution_desc": "Implement robust initialization with explicit timeouts and enable asynchronous error handling. Use environment variables to increase NCCL's verbosity for better logging of the specific rank failure.",
    "good_code": "import os\nimport datetime\nimport torch.distributed as dist\n\nos.environ[\"NCCL_ASYNC_ERROR_HANDLING\"] = \"1\"\nos.environ[\"NCCL_DEBUG\"] = \"INFO\"\n\ndist.init_process_group(\n    backend='nccl', \n    timeout=datetime.timedelta(seconds=1800),\n    init_method='env://'\n)",
    "verification": "Check logs for 'NCCL INFO' messages. Verify that if one process is killed, the others exit with a 'Watchdog' error instead of hanging indefinitely.",
    "date": "2026-03-24",
    "id": 1774314838,
    "type": "error"
});