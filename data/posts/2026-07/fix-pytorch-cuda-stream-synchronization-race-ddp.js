window.onPostDataLoaded({
    "title": "Fix PyTorch CUDA Stream Race Conditions in Distributed DDP",
    "slug": "fix-pytorch-cuda-stream-synchronization-race-ddp",
    "language": "Python",
    "code": "Race Condition",
    "tags": [
        "Python",
        "PyTorch",
        "CUDA",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In PyTorch Distributed Data Parallel (DDP) training pipelines, offloading auxiliary tensor operations (such as custom gradient clipping, metric tracking, or async data prefetching) to custom CUDA streams without explicit stream synchronization causes race conditions. Because DDP synchronizes parameters and gradients across GPU ranks on the default CUDA stream, un-synchronized custom streams executing concurrently produce non-deterministic memory corruption, gradient mismatch across ranks, or silent CUDA execution failures (e.g., <code>CUDA error: an illegal memory access was encountered</code>).</p>",
    "root_cause": "Asynchronous CUDA operations executing on non-default streams overlapping with PyTorch DDP parameter all-reduce without invoking explicit stream wait primitives.",
    "bad_code": "def custom_training_step(model, inputs, custom_stream):\n    with torch.cuda.stream(custom_stream):\n        outputs = model(inputs)\n        loss = outputs.sum()\n        loss.backward()\n    \n    # Race Condition: Default stream executes step before custom_stream finishes backward pass\n    optimizer.step()",
    "solution_desc": "Synchronize custom CUDA streams back to the current default stream using `torch.cuda.current_stream().wait_stream(custom_stream)` prior to optimizer steps or DDP gradient reductions.",
    "good_code": "def custom_training_step(model, inputs, custom_stream):\n    with torch.cuda.stream(custom_stream):\n        outputs = model(inputs)\n        loss = outputs.sum()\n        loss.backward()\n    \n    # Wait for custom_stream operations to complete on the current default stream\n    torch.cuda.current_stream().wait_stream(custom_stream)\n    optimizer.step()",
    "verification": "Execute distributed training with environment variable `CUDA_LAUNCH_BLOCKING=1` and `TORCH_DISTRIBUTED_DEBUG=DETAIL` to confirm all stream dependencies complete cleanly prior to gradient reductions.",
    "date": "2026-07-23",
    "id": 1784804448,
    "type": "error"
});