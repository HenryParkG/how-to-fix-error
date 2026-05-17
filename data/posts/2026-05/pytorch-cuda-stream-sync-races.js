window.onPostDataLoaded({
    "title": "Fixing CUDA Stream Sync Races in PyTorch",
    "slug": "pytorch-cuda-stream-sync-races",
    "language": "Python",
    "code": "CUDARaceCondition",
    "tags": [
        "Python",
        "Backend",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>In multi-GPU pipelines using custom CUDA streams, race conditions occur when a kernel on one stream consumes data produced by another stream without explicit synchronization. PyTorch's default stream behavior masks many issues, but when optimizing with <code>torch.cuda.Stream()</code>, the GPU may attempt to read a tensor before the kernel responsible for writing it has finished execution, leading to non-deterministic outputs or NaN values.</p>",
    "root_cause": "Asynchronous execution of kernels on different streams without calling `stream.wait_stream()` or `torch.cuda.synchronize()`.",
    "bad_code": "s1 = torch.cuda.Stream()\nwith torch.cuda.stream(s1):\n    y = model_part1(x)\n\n# Race condition: s0 (default) might start before s1 finishes\nz = model_part2(y)",
    "solution_desc": "Explicitly synchronize streams using `wait_stream` or ensure the consumer stream is aware of the producer's completion via events.",
    "good_code": "s1 = torch.cuda.Stream()\ncurrent_stream = torch.cuda.current_stream()\nwith torch.cuda.stream(s1):\n    y = model_part1(x)\n\n# Ensure the current stream waits for s1\ncurrent_stream.wait_stream(s1)\nz = model_part2(y)",
    "verification": "Enable `CUDA_LAUNCH_BLOCKING=1` to check if the error disappears when serialized, or use NVIDIA Nsight Systems to visualize stream overlaps and dependencies.",
    "date": "2026-05-17",
    "id": 1778983693,
    "type": "error"
});