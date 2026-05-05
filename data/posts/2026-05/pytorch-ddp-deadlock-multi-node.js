window.onPostDataLoaded({
    "title": "Mitigating PyTorch DDP Deadlocks in Multi-Node Training",
    "slug": "pytorch-ddp-deadlock-multi-node",
    "language": "Python",
    "code": "DistDeadlockErr",
    "tags": [
        "Python",
        "Backend",
        "Deep Learning",
        "Error Fix"
    ],
    "analysis": "<p>PyTorch DistributedDataParallel (DDP) relies on collective communication backends like NCCL or Gloo. A deadlock typically occurs during the gradient synchronization phase (all-reduce). If one rank (GPU process) crashes, hits an exception, or takes a different code path that skips the forward/backward pass, the remaining ranks will wait indefinitely for the missing rank's gradients.</p><p>This is common in multi-node setups where network instability or uneven data distribution (stragglers) causes ranks to drift out of sync.</p>",
    "root_cause": "Rank desynchronization where one or more processes fail to reach the collective communication barrier, coupled with a lack of communication timeouts.",
    "bad_code": "import torch.distributed as dist\n# Missing timeout and error handling\ndist.init_process_group(\"nccl\", rank=rank, world_size=size)\n# If this rank skips a loop iteration, others hang\noutput = model(input)",
    "solution_desc": "Set an explicit timeout in the process group initialization and use the 'join' context manager or 'DistributedSampler' to ensure all ranks process an equal number of batches. Enable NCCL async error handling via environment variables.",
    "good_code": "import datetime\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndist.init_process_group(\n    backend=\"nccl\", \n    timeout=datetime.timedelta(seconds=180),\n    init_method=\"env://\"\n)\n# Use DistributedSampler to ensure equal work\nsampler = torch.utils.data.distributed.DistributedSampler(dataset)",
    "verification": "Check logs for 'NCCL common error' instead of indefinite hangs. Use 'export NCCL_DEBUG=INFO' to verify all nodes are communicating before the training loop starts.",
    "date": "2026-05-05",
    "id": 1777946367,
    "type": "error"
});