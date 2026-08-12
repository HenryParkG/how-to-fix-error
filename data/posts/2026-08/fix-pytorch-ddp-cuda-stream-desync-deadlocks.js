window.onPostDataLoaded({
    "title": "Fix PyTorch DDP CUDA Stream Desync Deadlocks",
    "slug": "fix-pytorch-ddp-cuda-stream-desync-deadlocks",
    "language": "Python / PyTorch",
    "code": "NCCL_TIMEOUT_DEADLOCK",
    "tags": [
        "PyTorch",
        "CUDA",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>In multi-GPU distributed training using PyTorch DistributedDataParallel (DDP), executing custom kernel workloads or data pre-processing on separate CUDA streams without synchronization causes non-deterministic execution order across ranks. If one GPU rank enters an all-reduce collective barrier (such as standard gradient reduction during `loss.backward()`) while another GPU rank is still waiting on an unsynchronized custom CUDA stream operation, the NCCL communicator rings experience stream mismatch stalls. Eventually, this leads to indefinite blocking or an explicit <code>NCCL watchdog timeout</code> deadlock.</p>",
    "root_cause": "Operations launched asynchronously on a custom `torch.cuda.Stream()` are not explicit synchronized with the default computation stream before NCCL collective reductions execute, causing inter-rank desynchronization.",
    "bad_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef train_step(model, inputs, targets):\n    custom_stream = torch.cuda.Stream()\n    \n    # Asynchronous computation on custom stream without sync\n    with torch.cuda.stream(custom_stream):\n        transformed_inputs = inputs * 2.0  # Async CUDA kernel\n        \n    # Dynamic control flow based on un-synchronized output\n    # Rank 0 and Rank 1 may diverge or enter DDP backward at different relative times\n    outputs = model(transformed_inputs)\n    loss = torch.nn.functional.cross_entropy(outputs, targets)\n    \n    # DDP backward registers all-reduce on default stream\n    # custom_stream might not have finished, causing stream desync deadlock\n    loss.backward()",
    "solution_desc": "Explicitly synchronize the custom CUDA stream with the current stream using `torch.cuda.current_stream().wait_stream(custom_stream)` before proceeding to model forward/backward steps, ensuring all ranks reach collective barriers synchronously.",
    "good_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndef train_step(model, inputs, targets):\n    custom_stream = torch.cuda.Stream()\n    curr_stream = torch.cuda.current_stream()\n    \n    with torch.cuda.stream(custom_stream):\n        transformed_inputs = inputs * 2.0\n        \n    # Enforce stream dependency on the GPU without blocking CPU\n    curr_stream.wait_stream(custom_stream)\n    \n    # Safe execution on current stream\n    outputs = model(transformed_inputs)\n    loss = torch.nn.functional.cross_entropy(outputs, targets)\n    \n    # Collective operations inside backward execute synchronously across ranks\n    loss.backward()",
    "verification": "Run training with `TORCH_DISTRIBUTED_DEBUG=DETAIL` and `NCCL_DEBUG=INFO` set in the environment. Verify that all ranks execute collective ops synchronously without NCCL watchdog timeouts.",
    "date": "2026-08-12",
    "id": 1786509689,
    "type": "error"
});