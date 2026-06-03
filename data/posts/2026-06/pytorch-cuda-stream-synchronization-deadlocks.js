window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA Stream Deadlocks in Distributed DDP",
    "slug": "pytorch-cuda-stream-synchronization-deadlocks",
    "language": "Python",
    "code": "CudaStreamDeadlock",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When training large deep learning models with PyTorch Distributed Data Parallel (DDP), developers often use custom CUDA streams to overlap computation (e.g., forward/backward passes) with communication (e.g., parameter gradients all-reduce, or custom collective operations). This asynchronous pipelining is crucial for maximizing GPU utilization.</p><p>However, mixing asynchronous CUDA streams with distributed collective communication APIs (like <code>torch.distributed.all_reduce</code>) without rigorous stream synchronization is a recipe for system-wide deadlocks. CUDA operations are submitted to queues from the host CPU. If stream A is waiting for a CUDA event generated on stream B, but stream B's progress is blocked because the CPU thread is waiting on a blocking distributed collective that other nodes cannot reach, a circular wait condition is established. The CPU thread blocks waiting for a collective, while the GPU stream designated to execute the collective waits for a synchronization barrier that can never be reached.</p>",
    "root_cause": "Circular wait caused by blocking host-side thread execution (e.g., dist.all_reduce) while a custom CUDA stream is waiting on a GPU event that has not yet been queued, or vice-versa, across distributed nodes.",
    "bad_code": "import torch\nimport torch.distributed as dist\n\ndef train_step(model, data, rank):\n    # Create a custom stream to overlap computation\n    custom_stream = torch.cuda.Stream()\n    \n    with torch.cuda.stream(custom_stream):\n        # Async computation on custom stream\n        outputs = model(data)\n        loss = outputs.sum()\n        loss.backward()\n    \n    # BAD: Blocking collective on the default stream without ensuring \n    # that the custom stream has completed its backward pass CUDA kernels.\n    # This can stall the default stream and cause distributed ranks to desynchronize.\n    dist.all_reduce(model.parameters()[0].grad)\n    \n    # Wait for the custom stream to finish after calling the blocking collective\n    torch.cuda.current_stream().wait_stream(custom_stream)",
    "solution_desc": "To resolve the deadlock, guarantee strict execution order by using CUDA Events to synchronize the streams *before* invoking distributed collectives. The default stream must yield and wait for the custom stream's computations to be fully queued and synchronized on the device side before launching the blocking collective communication on the host CPU. This ensures all nodes hit the collective barrier uniformly.",
    "good_code": "import torch\nimport torch.distributed as dist\n\ndef train_step(model, data, rank):\n    custom_stream = torch.cuda.Stream()\n    event = torch.cuda.Event()\n    \n    with torch.cuda.stream(custom_stream):\n        outputs = model(data)\n        loss = outputs.sum()\n        loss.backward()\n        # Record an event indicating the backward pass has queued on this stream\n        event.record()\n    \n    # GOOD: Block the default stream on the CPU/GPU side until the event is reached,\n    # ensuring gradients are computed before the collective begins.\n    event.wait()\n    \n    # Now, the default stream can safely run the collective without deadlocking\n    dist.all_reduce(model.parameters()[0].grad)\n    \n    # Synchronize the device to ensure all operations are complete\n    torch.cuda.synchronize()",
    "date": "2026-06-03",
    "id": 1780492281,
    "type": "error"
});