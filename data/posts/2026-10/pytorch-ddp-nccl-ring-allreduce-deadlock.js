window.onPostDataLoaded({
    "title": "Fixing NCCL Desync Deadlocks in PyTorch DDP",
    "slug": "pytorch-ddp-nccl-ring-allreduce-deadlock",
    "language": "Python",
    "code": "DistCollectiveTimeout",
    "tags": [
        "Python",
        "Docker",
        "PyTorch",
        "NCCL",
        "Error Fix"
    ],
    "analysis": "<p>When training deep neural networks across multiple GPUs and nodes using PyTorch DistributedDataParallel (DDP), the NCCL backend creates ring-based or tree-based communication topologies. During operations like gradient synchronization or custom metric aggregation, every rank in the communication world must execute collective operations (e.g., <code>all_reduce</code>, <code>broadcast</code>) in the exact same logical order with matching tensor dimensions.</p><p>A deadlock manifests when asymmetric control flow occurs across ranks. For instance, if rank 0 enters an evaluation or checkpointing branch that triggers an <code>all_reduce</code>, while worker ranks skip directly to the next epoch's backward pass, the collective call ring will block indefinitely. Because GPU kernels are enqueued asynchronously, the CPU host thread will eventually block at the next CUDA synchronization point, throwing unhelpful timeout exceptions after standard watchdog expirations (default 1800 seconds).</p>",
    "root_cause": "Divergent execution paths across DDP worker ranks leading to desynchronized collective communication calls, causing NCCL ring buffers to block indefinitely waiting for non-participating ranks.",
    "bad_code": "import torch\nimport torch.distributed as dist\n\ndef train_epoch(model, dataloader, rank, epoch):\n    model.train()\n    total_loss = torch.tensor(0.0, device=f\"cuda:{rank}\")\n    \n    for step, (inputs, targets) in enumerate(dataloader):\n        # Bug: Early return on uneven batch counts without synchronization\n        if rank != 0 and step > 100:\n            break\n            \n        loss = model(inputs).sum()\n        loss.backward()\n        total_loss += loss.detach()\n        \n    # Collective called only by some ranks or after divergent iterations\n    dist.all_reduce(total_loss, op=dist.ReduceOp.SUM)\n    return total_loss.item()",
    "solution_desc": "Guarantee symmetric execution across all ranks by wrapping datasets with DistributedSampler configured with drop_last=True, or replace raw collectives with safe wrappers that enforce identical iteration counts across all ranks. Set the NCCL_ASYNC_ERROR_HANDLING environment variable and configure reasonable collective timeouts.",
    "good_code": "import os\nfrom datetime import timedelta\nimport torch\nimport torch.distributed as dist\nfrom torch.utils.data import DataLoader, DistributedSampler\n\ndef init_ddp(rank, world_size):\n    os.environ[\"NCCL_ASYNC_ERROR_HANDLING\"] = \"1\"\n    dist.init_process_group(\n        backend=\"nccl\",\n        init_method=\"env://\",\n        world_size=world_size,\n        rank=rank,\n        timeout=timedelta(seconds=120)\n    )\n\ndef train_epoch(model, dataset, rank, world_size, epoch):\n    model.train()\n    # drop_last=True ensures every rank processes identical batch counts\n    sampler = DistributedSampler(\n        dataset,\n        num_replicas=world_size,\n        rank=rank,\n        shuffle=True,\n        drop_last=True\n    )\n    sampler.set_epoch(epoch)\n    loader = DataLoader(dataset, batch_size=32, sampler=sampler)\n    \n    total_loss = torch.tensor(0.0, device=f\"cuda:{rank}\")\n    for inputs, targets in loader:\n        inputs, targets = inputs.to(rank), targets.to(rank)\n        loss = model(inputs).sum()\n        loss.backward()\n        total_loss += loss.detach()\n        \n    # All ranks reach this collective simultaneously with identical shapes\n    dist.all_reduce(total_loss, op=dist.ReduceOp.SUM)\n    return total_loss.item() / world_size",
    "verification": "Run distributed jobs with `export TORCH_DISTRIBUTED_DEBUG=DETAIL` and verify via torch.distributed logging that all ranks complete each synchronization step uniformly without watchdog timeouts.",
    "date": "2026-10-10",
    "id": 1791602698,
    "type": "error"
});