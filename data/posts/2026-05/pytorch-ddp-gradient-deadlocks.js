window.onPostDataLoaded({
    "title": "Resolving PyTorch DDP Gradient Deadlocks",
    "slug": "pytorch-ddp-gradient-deadlocks",
    "language": "Python",
    "code": "Deadlock",
    "tags": [
        "Python",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) in PyTorch relies on a strict synchronization of gradients across multiple GPUs using All-Reduce collectives. A deadlock occurs when one or more ranks (processes) fail to enter the gradient synchronization phase that other ranks are waiting for. This usually happens when the computation graph differs across ranks or when conditional logic prevents the backward pass from reaching certain parameters.</p><p>In complex models with conditional execution, some parameters might not participate in the forward pass on certain iterations. If DDP expects gradients for these parameters but they aren't generated, the All-Reduce operation hangs indefinitely.</p>",
    "root_cause": "Inconsistent computation graphs across ranks or misconfigured 'find_unused_parameters' when some model outputs are not used in the loss calculation.",
    "bad_code": "model = DistributedDataParallel(raw_model)\n\n# RANK 0 executes this\nif rank == 0:\n    output = model(input_a)\n# RANK 1 executes this\nelse:\n    output = model(input_b)\n\nloss = criterion(output, target)\nloss.backward() # DEADLOCK: Ranks have different graph nodes for synchronization",
    "solution_desc": "Ensure all ranks execute the same forward and backward logic. If certain parameters are intentionally unused, set 'find_unused_parameters=True' in the DDP constructor to allow the communication bucket to ignore them. Alternatively, ensure dummy gradients are provided.",
    "good_code": "# Initialize with find_unused_parameters if the graph is dynamic\nmodel = DistributedDataParallel(raw_model, device_ids=[rank], find_unused_parameters=True)\n\n# Ensure all ranks participate in the same collective communication\noutput = model(input_data)\nloss = criterion(output, target)\nloss.backward()",
    "verification": "Set environment variable 'TORCH_DISTRIBUTED_DEBUG=DETAIL' to log which rank is failing to synchronize and monitor NCCL timeouts.",
    "date": "2026-05-13",
    "id": 1778653131,
    "type": "error"
});