window.onPostDataLoaded({
    "title": "Resolving NCCL All-Reduce Deadlocks in Distributed Training",
    "slug": "nccl-all-reduce-deadlock-distributed-transformer",
    "language": "Python",
    "code": "RuntimeError: NCCL Error 2",
    "tags": [
        "Python",
        "Backend",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>In distributed Transformer training, NCCL deadlocks typically occur during the All-Reduce step of gradient synchronization. This happens when individual ranks (GPUs) do not reach the collective communication primitive at the same time, or when there is an imbalance in the computation graph. Specifically, if one rank encounters a conditional logic branch that skips a gradient update while others proceed, the entire ring-reduce algorithm hangs indefinitely.</p>",
    "root_cause": "Desynchronization of collective communication calls across ranks, often caused by conditional forward passes or mismatched tensor shapes in dynamic architectures.",
    "bad_code": "if rank == 0 and some_condition:\n    loss = model(input)\n    loss.backward()\n# Rank 1-N proceed to optimizer step, but Rank 0 is stuck\noptimizer.step()",
    "solution_desc": "Ensure all ranks participate in the collective communication by wrapping operations in distributed barriers or using 'find_unused_parameters=True' in DDP to handle inactive nodes in the computation graph.",
    "good_code": "import torch.distributed as dist\n\n# Ensure all ranks participate or utilize DDP hooks\nmodel = torch.nn.parallel.DistributedDataParallel(model, device_ids=[rank], find_unused_parameters=True)\n\n# Explicit synchronization if custom logic is used\ndist.barrier()\noptimizer.step()",
    "verification": "Monitor GPU utilization using 'nvidia-smi'; if utilization drops to 0% but memory remains full, the deadlock is present. Fix is verified if 'NCCL_DEBUG=INFO' shows successful completion of all-reduce rings.",
    "date": "2026-04-06",
    "id": 1775459905,
    "type": "error"
});