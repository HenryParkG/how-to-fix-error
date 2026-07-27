window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP AllReduce Deadlocks in Parallelism",
    "slug": "fixing-pytorch-ddp-allreduce-deadlocks-pipeline-parallelism",
    "language": "Python / PyTorch",
    "code": "NCCL_DEADLOCK",
    "tags": [
        "PyTorch",
        "Python",
        "Distributed",
        "Deep Learning",
        "Error Fix"
    ],
    "analysis": "<p>When training large language models combining DistributedDataParallel (DDP) or Fully Sharded Data Parallel (FSDP) with Pipeline Parallelism (PP) and Automatic Mixed Precision (AMP), gradient communication can permanently hang. Because DDP automatically registers backward hooks to initiate `ncclAllReduce` bucket reductions asynchronously as gradients finish, execution order mismatches across different pipeline stage ranks cause collective NCCL operations to issue in non-matching order, leading to unrecoverable distributed deadlocks.</p>",
    "root_cause": "DDP gradient bucket reduction hooks trigger automatically during the backward pass. When executing micro-batches in pipeline parallelism, rank 0 may execute backward passes while higher ranks wait on forward activations, causing out-of-order NCCL AllReduce collective invocations across different CUDA streams.",
    "bad_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef train_pipeline_step(model, micro_batches, optimizer, scaler):\n    # BUG: Running DDP standard backward across micro-batches causes premature AllReduce\n    model = DDP(model)\n    for batch in micro_batches:\n        with torch.cuda.amp.autocast():\n            output = model(batch)\n            loss = output.sum()\n        # Triggers automatic NCCL AllReduce on micro-batch, deadlocking pipeline pipeline ranks\n        scaler.scale(loss).backward()\n    \n    scaler.step(optimizer)\n    scaler.update()",
    "solution_desc": "Disable automatic gradient synchronization during micro-batch processing using the `model.no_sync()` context manager. Enable gradient synchronization only on the final micro-batch iteration of the pipeline schedule to guarantee matching NCCL operation sequences across all ranks.",
    "good_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef train_pipeline_step_fixed(model, micro_batches, optimizer, scaler):\n    # Wrap model in DDP with gradient bucketing disabled during pipeline micro-batches\n    ddp_model = DDP(model)\n    num_batches = len(micro_batches)\n\n    for i, batch in enumerate(micro_batches):\n        # Fix: Suppress AllReduce until the very last micro-batch\n        is_last_batch = (i == num_batches - 1)\n        \n        context = ddp_model.no_sync if not is_last_batch else torch.cuda.amp.autocast\n        with context():\n            with torch.cuda.amp.autocast():\n                output = ddp_model(batch)\n                loss = output.sum() / num_batches\n            scaler.scale(loss).backward()\n\n    scaler.step(optimizer)\n    scaler.update()\n    optimizer.zero_grad()",
    "verification": "Run training with `TORCH_DISTRIBUTED_DEBUG=DETAIL` and `NCCL_DEBUG=INFO`. Confirm that gradient AllReduce calls occur strictly once per optimizer step and that rank CUDA stream operations finish synchronously without timing out.",
    "date": "2026-07-27",
    "id": 1785133067,
    "type": "error"
});