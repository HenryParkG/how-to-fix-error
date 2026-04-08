window.onPostDataLoaded({
    "title": "Resolving PyTorch DDP Deadlocks in Heterogeneous Clusters",
    "slug": "pytorch-ddp-heterogeneous-deadlocks",
    "language": "Python",
    "code": "NCCL_TIMEOUT",
    "tags": [
        "Python",
        "Backend",
        "Machine Learning",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) deadlocks in heterogeneous clusters usually stem from desynchronized collective communication. When nodes have varying TFLOPS (e.g., mixing RTX 3090 and 4090) or different interconnect latencies, the 'find_unused_parameters=True' flag can cause non-deterministic bucket reduction order.</p><p>This leads to a state where Rank 0 is waiting for a gradient reduction that Rank 1 has already skipped or reordered, resulting in a permanent NCCL timeout or process hang during the backward pass.</p>",
    "root_cause": "Race conditions in gradient bucket synchronization exacerbated by compute variance and dynamic execution graphs.",
    "bad_code": "model = torch.nn.parallel.DistributedDataParallel(\n    model, \n    device_ids=[rank], \n    find_unused_parameters=True\n)",
    "solution_desc": "Set 'find_unused_parameters=False' to enforce a static execution graph. If unused parameters are necessary, use 'torch.distributed.barrier()' explicitly or implement 'join()' contexts to handle uneven shard processing.",
    "good_code": "from torch.nn.parallel import DistributedDataParallel as DDP\n\n# Ensure static graph to prevent reordering\nmodel = DDP(model, device_ids=[rank], find_unused_parameters=False)\n\n# Or use the join context for heterogeneous workloads\nwith model.join():\n    output = model(input)\n    loss = criterion(output, target)\n    loss.backward()",
    "verification": "Monitor GPU utilization using 'nvidia-smi'; a deadlock shows 0% utilization with high memory usage. Ensure training completes 10 epochs without NCCL timeout.",
    "date": "2026-04-08",
    "id": 1775642461,
    "type": "error"
});