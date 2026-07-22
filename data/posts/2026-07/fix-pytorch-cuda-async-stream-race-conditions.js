window.onPostDataLoaded({
    "title": "Fix PyTorch CUDA Async Stream Race Conditions",
    "slug": "fix-pytorch-cuda-async-stream-race-conditions",
    "language": "Python",
    "code": "CUDA Async Race Condition",
    "tags": [
        "PyTorch",
        "CUDA",
        "Python",
        "Deep Learning",
        "Error Fix"
    ],
    "analysis": "<p>In multi-GPU PyTorch pipelines and custom data-parallel workloads, asynchronous execution on non-default CUDA streams can introduce subtle race conditions. Tensors created or mutated on one CUDA stream may be accessed on another stream before computation completes, leading to non-deterministic data corruption, silent tensor output invalidation, or segmentation faults.</p>",
    "root_cause": "PyTorch executes CUDA kernel operations asynchronously relative to the CPU. When passing CUDA memory buffers across distinct CUDA streams without explicit stream synchronization (stream.wait_stream) or memory reference synchronization (tensor.record_stream), the CUDA allocator may reuse or read memory before preceding stream operations complete.",
    "bad_code": "import torch\n\ndef execute_pipeline_step(x):\n    stream1 = torch.cuda.Stream()\n    stream2 = torch.cuda.Stream()\n    \n    # Produce tensor on stream1\n    with torch.cuda.stream(stream1):\n        intermediate = x * 2.0\n        intermediate = torch.relu(intermediate)\n    \n    # Race condition: stream2 reads intermediate before stream1 kernel completes\n    with torch.cuda.stream(stream2):\n        output = torch.matmul(intermediate, intermediate.T)\n    \n    return output",
    "solution_desc": "To fix CUDA async stream race conditions, instruct the consuming stream to wait for the producing stream using `stream2.wait_stream(stream1)`. Additionally, register the tensor on the new stream using `tensor.record_stream(stream)` so PyTorch's Caching Allocator does not deallocate memory prematurely.",
    "good_code": "import torch\n\ndef execute_pipeline_step(x):\n    stream1 = torch.cuda.Stream()\n    stream2 = torch.cuda.Stream()\n    \n    # Produce tensor on stream1\n    with torch.cuda.stream(stream1):\n        intermediate = x * 2.0\n        intermediate = torch.relu(intermediate)\n    \n    # Ensure stream2 waits for stream1 operations to finish\n    stream2.wait_stream(stream1)\n    \n    with torch.cuda.stream(stream2):\n        # Record tensor on stream2 to prevent allocator allocation reuse races\n        intermediate.record_stream(stream2)\n        output = torch.matmul(intermediate, intermediate.T)\n    \n    return output",
    "verification": "Set the environment variable `CUDA_LAUNCH_BLOCKING=1` to test synchronous execution comparison, and use PyTorch's CUDA memory sanitizer (`torch.cuda.memory._record_memory_history()`) alongside 1,000 continuous test iterations to verify numeric consistency across parallel stream runs.",
    "date": "2026-07-22",
    "id": 1784684790,
    "type": "error"
});