window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP CUDA Memory Fragmentation",
    "slug": "fixing-pytorch-ddp-cuda-memory-fragmentation",
    "language": "Python / PyTorch",
    "code": "CUDA OOM Error",
    "tags": [
        "PyTorch",
        "CUDA",
        "DDP",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>When training large neural networks across multi-GPU setups using PyTorch DistributedDataParallel (DDP), memory fragmentation often causes sudden CUDA Out of Memory (OOM) errors despite sufficient unallocated VRAM. DDP coalesces gradients into fixed-size communication buckets (default 25MB) to overlap computation with all-reduce operations. When dynamic tensor shapes, unaligned bucket allocations, or frequent tensor allocations/deallocations happen alongside DDP bucket reductions, the PyTorch CUDA caching allocator fails to find contiguous memory blocks, resulting in OOM crashes.</p>",
    "root_cause": "Gradient bucketing allocates contiguous memory buffers during backward passes. When combined with dynamic activations and non-aligned memory split sizes, the PyTorch CUDA memory allocator splits free blocks into small isolated fragments that cannot satisfy subsequent large contiguous tensor requests.",
    "bad_code": "import torch\nimport torch.nn as nn\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\n# Default bucket configuration with dynamic tensor allocations causes CUDA fragmentation\nmodel = LargeTransformerModel().cuda()\nddp_model = DDP(model, device_ids=[local_rank])  # bucket_cap_mb defaults to 25MB",
    "solution_desc": "Set the `PYTORCH_CUDA_ALLOC_CONF` environment variable with `max_split_size_mb` to prevent large block splits, enable `gradient_as_bucket_view=True` to avoid redundant gradient memory copies, and tune `bucket_cap_mb` to align with backend memory chunk boundaries.",
    "good_code": "import os\nimport torch\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\n# Prevent allocator from splitting memory blocks larger than 128MB\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"max_split_size_mb:128\"\n\nmodel = LargeTransformerModel().cuda()\nddp_model = DDP(\n    model,\n    device_ids=[local_rank],\n    bucket_cap_mb=64,\n    gradient_as_bucket_view=True,\n    static_graph=True\n)",
    "verification": "Run training with `torch.cuda.memory_summary()` active and confirm that `num_alloc_retries` remains 0 and allocated vs. reserved memory gaps stay minimal without OOM errors.",
    "date": "2026-08-08",
    "id": 1786181466,
    "type": "error"
});