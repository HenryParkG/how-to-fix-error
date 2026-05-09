window.onPostDataLoaded({
    "title": "Fixing CUDA Stream Deadlocks in Multi-GPU Pipelines",
    "slug": "cuda-stream-sync-deadlocks-multi-gpu",
    "language": "Python",
    "code": "CUDA_ERROR_LAUNCH_FAILED",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Multi-GPU inference pipelines often use multiple CUDA streams to overlap data transfer (H2D) with computation. Deadlocks occur when a circular dependency is created between streams on different devices, specifically when using blocking synchronization calls like <code>torch.cuda.synchronize()</code> or <code>cudaStreamSynchronize</code> within a thread pool that shares global resources.</p>",
    "root_cause": "A blocking call on the default stream (Stream 0) can block subsequent work on non-blocking streams. In multi-GPU setups, if GPU 0 is waiting for GPU 1's event, but GPU 1 is blocked by a host-side synchronization call from GPU 0's management thread, a deadlock occurs.",
    "bad_code": "# Potentially deadlocking code\nstream1 = torch.cuda.Stream(device=0)\nstream2 = torch.cuda.Stream(device=1)\n\nwith torch.cuda.stream(stream1):\n    # Task 1\n    torch.cuda.synchronize(device=0) # Blocks host thread\n    # Task 2 depends on stream2 which never starts because host is blocked",
    "solution_desc": "Use non-blocking CUDA events (<code>torch.cuda.Event</code>) for inter-stream and inter-device synchronization instead of host-side synchronization. This allows the GPU scheduler to manage dependencies without halting the CPU management thread.",
    "good_code": "event = torch.cuda.Event(enable_timing=False, interprocess=False)\nwith torch.cuda.stream(stream1):\n    # Do work on GPU 0\n    event.record(stream1)\n\nwith torch.cuda.stream(stream2):\n    # GPU 1 waits for GPU 0 without blocking the CPU\n    stream2.wait_event(event)\n    # Do work on GPU 1",
    "verification": "Use NVIDIA Nsight Systems to visualize the timeline. Ensure there are no gaps where the CPU is idle while GPUs are waiting for each other.",
    "date": "2026-05-09",
    "id": 1778292098,
    "type": "error"
});