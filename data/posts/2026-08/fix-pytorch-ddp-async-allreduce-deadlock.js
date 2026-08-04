window.onPostDataLoaded({
    "title": "Fix PyTorch DDP Async AllReduce Buffer Deadlocks",
    "slug": "fix-pytorch-ddp-async-allreduce-deadlock",
    "language": "Python",
    "code": "DDP_BUFFER_MISMATCH",
    "tags": [
        "PyTorch",
        "Distributed Systems",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>When executing PyTorch Distributed Data Parallel (DDP) training across multiple GPU nodes, asynchronous gradient reduction operations or custom non-blocking hooks can lead to silent collective communication deadlocks. This occurs when rank execution paths diverge conditionally or when CUDA tensor allocations mismatch during async stream execution.</p><p>As CUDA kernels launch asynchronously across default and background streams, NCCL primitives depend on deterministically ordered queue submissions across all processes. If Rank 0 enqueues an asynchronous AllReduce while Rank 1 enqueues tensors of different shapes or skips execution due to conditional branching, the NCCL communicator hangs indefinitely waiting for matching collective calls.</p>",
    "root_cause": "Conditional control flow causing divergent collective tensor operations across rank processes, coupled with un-synchronized non-blocking NCCL stream execution.",
    "bad_code": "import torch\nimport torch.distributed as dist\n\ndef train_step(model, inputs, rank):\n    outputs = model(inputs)\n    loss = outputs.sum()\n    loss.backward()\n    \n    # Bug: Conditional execution based on rank or dynamic threshold\n    if rank == 0 and loss.item() > 1.0:\n        tensor = torch.tensor([loss.item()]).cuda(rank)\n        dist.all_reduce(tensor, async_op=True)  # Hanging call across nodes!\n    elif rank != 0:\n        tensor = torch.tensor([0.0]).cuda(rank)\n        dist.all_reduce(tensor, async_op=True) # Mismatched tensor timing/shape",
    "solution_desc": "Ensure all ranks strictly execute identical collective operations with matching shapes, data types, and order. Synchronize dynamic CUDA operations and use explicit handle waiting instead of uncoordinated non-blocking calls.",
    "good_code": "import torch\nimport torch.distributed as dist\n\ndef train_step(model, inputs, rank):\n    outputs = model(inputs)\n    loss = outputs.sum()\n    loss.backward()\n    \n    # Ensured symmetric execution path across all ranks\n    tensor = torch.tensor([loss.item()], device=f'cuda:{rank}')\n    \n    # Synchronous or strictly ordered async call with identical shapes\n    handle = dist.all_reduce(tensor, op=dist.ReduceOp.SUM, async_op=True)\n    handle.wait()  # Synchronize work handle before downstream CUDA ops",
    "verification": "Set TORCH_DISTRIBUTED_DEBUG=DETAIL and NCCL_DEBUG=INFO environment variables, then run multi-GPU training via `torchrun --nproc_per_node=2` to verify zero collective communication timeouts.",
    "date": "2026-08-04",
    "id": 1785821971,
    "type": "error"
});