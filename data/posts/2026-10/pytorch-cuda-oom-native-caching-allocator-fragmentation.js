window.onPostDataLoaded({
    "title": "Fix PyTorch CUDA OOM from Allocator Fragmentation",
    "slug": "pytorch-cuda-oom-native-caching-allocator-fragmentation",
    "language": "Python",
    "code": "torch.cuda.OutOfMemoryError",
    "tags": [
        "Python",
        "PyTorch",
        "CUDA",
        "Deep Learning",
        "Error Fix"
    ],
    "analysis": "<p>PyTorch uses a caching allocator (based on <code>cudaMalloc</code> and segregated free lists) to minimize the overhead of device memory allocations during training and inference. However, when workloads dynamically allocate variable-sized tensors (such as dynamic sequence lengths in transformers or progressive image resizing), the caching allocator's internal pools become heavily fragmented.</p><p>In fragmented states, <code>torch.cuda.memory_reserved()</code> may show that ample device memory is physically retained by the process, yet <code>torch.cuda.memory_allocated()</code> is low. When a new contiguous allocation request arrives, the allocator fails to find a single contiguous block within its existing pools and queries the driver via <code>cudaMalloc</code>. If total physical VRAM is saturated by retained blocks, the driver fails with an OutOfMemoryError despite vast quantities of unallocated cache space.</p>",
    "root_cause": "Dynamic tensor shape variations cause the internal pool to fragment into non-contiguous blocks, preventing the reuse of cached memory for larger contiguous requests and exhausting VRAM at the driver level.",
    "bad_code": "import torch\nimport torch.nn as nn\n\n# Dynamic sequence lengths trigger high allocation churn and fragmentation\nmodel = nn.TransformerEncoderLayer(d_model=1024, nhead=16).cuda()\noptimizer = torch.optim.Adam(model.parameters())\n\nfor epoch in range(100):\n    # Unsorted batch sizes and variable lengths trigger erratic memory footprints\n    seq_len = torch.randint(256, 4096, (1,)).item()\n    inputs = torch.randn(seq_len, 32, 1024, device='cuda')\n    \n    optimizer.zero_grad()\n    output = model(inputs)\n    loss = output.sum()\n    loss.backward()\n    optimizer.step()\n    # Over time: torch.cuda.OutOfMemoryError: CUDA out of memory",
    "solution_desc": "Configure PyTorch's native caching allocator using the max_split_size_mb heuristic or enable expandable segments via the PYTORCH_CUDA_ALLOC_CONF environment variable. Additionally, implement sequence bucketing/padding to normalize tensor dimensions and periodically invoke torch.cuda.empty_cache() or rely on virtual memory mapping.",
    "good_code": "import os\n# Enable expandable segments to allow non-contiguous physical blocks to form contiguous virtual blocks\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True,max_split_size_mb:128\"\n\nimport torch\nimport torch.nn as nn\n\nmodel = nn.TransformerEncoderLayer(d_model=1024, nhead=16).cuda()\noptimizer = torch.optim.Adam(model.parameters())\n\n# Group inputs into fixed bucketed sequence lengths to stabilize allocations\nBUCKET_SIZES = [512, 1024, 2048, 4096]\n\ndef pad_to_bucket(length):\n    return min(b for b in BUCKET_SIZES if b >= length)\n\nfor epoch in range(100):\n    raw_len = torch.randint(256, 4096, (1,)).item()\n    padded_len = pad_to_bucket(raw_len)\n    inputs = torch.randn(padded_len, 32, 1024, device='cuda')\n    \n    optimizer.zero_grad()\n    output = model(inputs)\n    loss = output.sum()\n    loss.backward()\n    optimizer.step()",
    "verification": "Inspect allocation metrics via `print(torch.cuda.memory_summary())`. Verify that `reserved_bytes` closely tracks `allocated_bytes` and check that the allocation retries count (`num_alloc_retries`) remains zero throughout high-variability training runs.",
    "date": "2026-10-25",
    "id": 1792935352,
    "type": "error"
});