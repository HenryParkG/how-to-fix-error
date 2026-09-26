window.onPostDataLoaded({
    "title": "Fix PyTorch CUDA Graph Invalidation and Memory Thrashing",
    "slug": "pytorch-cuda-graph-invalidation-dynamic-shapes",
    "language": "Python",
    "code": "CUDAGraphCaptureError",
    "tags": [
        "Python",
        "CUDA",
        "PyTorch",
        "DeepLearning",
        "Error Fix"
    ],
    "analysis": "<p>CUDA Graphs dramatically reduce kernel launch overhead by recording a sequence of CUDA operations once and replaying them on the GPU with minimal CPU interaction. However, CUDA Graph capture fundamentally requires static tensor addresses and immutable memory layouts. When models process variable-sized inputs (such as variable batch sizes or dynamic token lengths) without static bucketization, the runtime attempts to re-record graphs or triggers internal dynamic shape allocations within the capture region.</p><p>During capture, operations that invoke <code>cudaMalloc</code> or allocate tensors via PyTorch's caching allocator outside of pre-configured capture memory pools trigger a capture invalidation or severe GPU memory thrashing. The caching allocator cannot resize device buffers within an active stream capture, causing either <code>RuntimeError: CUDA error: operation not permitted when stream is capturing</code> or silent graph recreation every step, which drains host memory and exhausts GPU VRAM due to orphaned graph memory pools.</p>",
    "root_cause": "Dynamic tensor shapes during graph capture force dynamic buffer reallocations. CUDA Graphs prohibit native allocator interactions during capture; variable sequence lengths invalidate cached device pointers, triggering graph recapture cascades and severe memory pool fragmentation.",
    "bad_code": "import torch\n\nmodel = torch.nn.Linear(128, 128).cuda()\nstream = torch.cuda.Stream()\ngraph = torch.cuda.CUDAGraph()\n\n# Dynamic inputs arriving with variable batch sizes\nbatch_sizes = [16, 32, 16, 64]\n\nfor bs in batch_sizes:\n    x = torch.randn(bs, 128, device='cuda')\n    # Recapturing or running with mismatching tensor dimensions inside graph\n    with torch.cuda.graph(graph, stream=stream):\n        out = model(x)  # Allocates new memory during capture -> RuntimeError",
    "solution_desc": "Architect a static memory execution harness using fixed-size scratchpad tensors and tensor padding (or bucketing). Pre-allocate static input/output buffers at the maximum upper bound, initialize a shared private memory pool via `torch.cuda.graph_pool_handle()`, and slice outputs back to dynamic target lengths post-replay without invalidating the static computational graph.",
    "good_code": "import torch\n\nMAX_BS = 64\nHIDDEN_DIM = 128\n\nmodel = torch.nn.Linear(HIDDEN_DIM, HIDDEN_DIM).cuda()\nmodel.eval()\n\n# Allocate static buffers\nstatic_input = torch.empty((MAX_BS, HIDDEN_DIM), device='cuda')\nstatic_output = torch.empty((MAX_BS, HIDDEN_DIM), device='cuda')\n\n# Warmup & capture with static pointers\ns = torch.cuda.Stream()\ns.wait_stream(torch.cuda.current_stream())\nwith torch.cuda.stream(s):\n    for _ in range(3):\n        static_output.copy_(model(static_input))\ntorch.cuda.current_stream().wait_stream(s)\n\ngraph = torch.cuda.CUDAGraph()\nwith torch.cuda.graph(graph, stream=s):\n    static_output.copy_(model(static_input))\n\ndef forward_infer(dynamic_x: torch.Tensor) -> torch.Tensor:\n    bs = dynamic_x.shape[0]\n    assert bs <= MAX_BS, f\"Input batch size {bs} exceeds max {MAX_BS}\"\n    # Zero-copy placement into static buffer memory\n    static_input[:bs].copy_(dynamic_x)\n    graph.replay()\n    return static_output[:bs].clone()",
    "verification": "Profile execution using `torch.cuda.amp.autocast()` and `torch.profiler.profile()`. Verify that the timeline contains repetitive `GraphExec` events without intermediate `cudaMalloc` or `cudaFree` calls, and memory usage remains flat across dynamic batch iterations.",
    "date": "2026-09-26",
    "id": 1790390168,
    "type": "error"
});