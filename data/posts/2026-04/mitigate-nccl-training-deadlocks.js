window.onPostDataLoaded({
    "title": "Mitigating Distributed Training Deadlocks in NCCL",
    "slug": "mitigate-nccl-training-deadlocks",
    "language": "Python",
    "code": "NCCL_COMM_ABORT",
    "tags": [
        "Python",
        "AWS",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Distributed deep learning using NCCL collectives (like AllReduce) is prone to deadlocks when ranks diverge. If one node hits a CUDA Out-of-Memory (OOM) or a data-loading error while others are waiting at a collective barrier, the entire cluster hangs indefinitely without a clear error message.</p>",
    "root_cause": "The default NCCL behavior is to wait indefinitely for all ranks to reach the synchronization point, with no internal timeout mechanism for partial failures.",
    "bad_code": "import torch.distributed as dist\n\n# Default initialization has no timeout\ndist.init_process_group(backend='nccl')\n# If one rank fails here, others wait forever\ndist.all_reduce(tensor)",
    "solution_desc": "Initialize the process group with an explicit `timeout` and use the `NCCL_ASYNC_ERROR_HANDLING` environment variable to trigger a process crash when a collective times out, allowing the job orchestrator to restart the training.",
    "good_code": "import datetime\nimport torch.distributed as dist\nimport os\n\nos.environ[\"NCCL_ASYNC_ERROR_HANDLING\"] = \"1\"\n\ndist.init_process_group(\n    backend='nccl', \n    timeout=datetime.timedelta(seconds=1800) # 30 min timeout\n)\ntry:\n    dist.all_reduce(tensor)\nexcept Exception as e:\n    dist.destroy_process_group()\n    raise e",
    "verification": "Artificially kill a single rank process during a training epoch and ensure the other ranks exit with a timeout error rather than hanging.",
    "date": "2026-04-02",
    "id": 1775113318,
    "type": "error"
});