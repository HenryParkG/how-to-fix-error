window.onPostDataLoaded({
    "title": "PyTorch DDP: Fix NCCL AllReduce Deadlocks",
    "slug": "pytorch-ddp-nccl-deadlock-cuda-streams",
    "language": "Python",
    "code": "RuntimeError: NCCL error",
    "tags": [
        "PyTorch",
        "NCCL",
        "Distributed",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>In multi-GPU distributed training using PyTorch's DistributedDataParallel (DDP) with the NCCL backend, deadlocks frequently arise from asymmetric collective execution or out-of-order CUDA stream operations across ranks. The NCCL ring AllReduce algorithm coordinates GPU workers in a logical communication ring, expecting every rank to invoke collective communication kernels in identical sequence and with matching tensor allocations.</p><p>When developers introduce auxiliary CUDA streams for asynchronous data transfers, custom metric computation, or gradient post-processing without explicit stream synchronization, the implicit stream dependencies diverge across ranks. If Rank 0 enqueues an AllReduce collective on the default stream while waiting for a side stream, but Rank 1 enqueues another collective operation first due to micro-variations in kernel launch latency or conditional branching, a cyclic dependency deadlock locks the entire cluster.</p>",
    "root_cause": "Mismatched collective operation ordering across distributed ranks or non-blocking side CUDA streams dispatching NCCL collectives without proper event synchronization, causing circular wait states within the NCCL communication ring.",
    "bad_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef train_step(model, optimizer, data, rank):\n    optimizer.zero_grad()\n    outputs = model(data)\n    loss = outputs.sum()\n    loss.backward()\n    \n    # BUG: Rank-specific branch causes divergent collective calls across ranks\n    if rank == 0 and loss.item() > 10.0:\n        dist.all_reduce(loss, op=dist.ReduceOp.SUM)\n    \n    # BUG: Side stream executing collective without synchronization\n    side_stream = torch.cuda.Stream()\n    with torch.cuda.stream(side_stream):\n        aux_tensor = loss.detach().clone()\n        dist.all_reduce(aux_tensor, op=dist.ReduceOp.AVG)\n        \n    optimizer.step()",
    "solution_desc": "Guarantee that all distributed collective operations execute unconditionally and symmetrically across every participating rank. For side-stream operations, explicitly record CUDA events and call wait_stream() to enforce deterministic synchronization boundaries before and after communication collectives.",
    "good_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef train_step(model, optimizer, data, rank, aux_stream):\n    optimizer.zero_grad()\n    outputs = model(data)\n    loss = outputs.sum()\n    loss.backward()\n    \n    # Symmetrical collective execution across all ranks\n    loss_metric = loss.detach().clone()\n    dist.all_reduce(loss_metric, op=dist.ReduceOp.SUM)\n    \n    # Explicit stream synchronization for parallel tasks\n    curr_stream = torch.cuda.current_stream()\n    aux_stream.wait_stream(curr_stream)\n    \n    with torch.cuda.stream(aux_stream):\n        aux_metric = loss.detach().clone()\n        dist.all_reduce(aux_metric, op=dist.ReduceOp.AVG)\n        \n    # Enforce barrier before parameter updates\n    curr_stream.wait_stream(aux_stream)\n    optimizer.step()",
    "verification": "Set the environment variables TORCH_DISTRIBUTED_DEBUG=DETAIL and NCCL_DEBUG=INFO. Run multi-GPU stress tests to confirm that collective sequence IDs match across all ranks and watchdog monitors exit without timeout aborts.",
    "date": "2026-10-06",
    "id": 1791258966,
    "type": "error"
});