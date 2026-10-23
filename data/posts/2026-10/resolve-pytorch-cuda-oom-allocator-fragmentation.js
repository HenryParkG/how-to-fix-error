window.onPostDataLoaded({
    "title": "Resolve PyTorch CUDA OOM from Allocator Fragmentation",
    "slug": "resolve-pytorch-cuda-oom-allocator-fragmentation",
    "language": "Python",
    "code": "CUDA out of memory",
    "tags": [
        "Python",
        "CUDA",
        "PyTorch",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>During inference or training with dynamic batching, input sequences have non-uniform lengths. PyTorch's native <code>cachingAllocator</code> divides GPU memory into split pools of 512-byte small blocks and 20MB large blocks. When sequence lengths vary continuously, tensors of disparate shapes are allocated and freed at millisecond frequencies.</p><p>Over time, this rapid allocation churn causes high virtual memory fragmentation: total free VRAM reported by the driver is adequate, but no single contiguous virtual memory page exists to satisfy new buffer requests. The execution halts with <code>torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate X MiB (GPU 0; total capacity; Y MiB already allocated; Z MiB free; N MiB reserved in PyTorch)</code>, where <code>reserved - allocated</code> confirms severe internal fragmentation.</p>",
    "root_cause": "Dynamic tensor allocations with high sequence-length variance causing non-contiguous memory fragmentation within PyTorch caching allocator pools.",
    "bad_code": "import torch\n\ndef dynamic_inference_loop(model, dataloader):\n    model.eval()\n    # BUG: Dynamic batch inputs with wildly variable seq_len cause severe fragmentation\n    with torch.no_grad():\n        for batch in dataloader:\n            inputs = batch['tokens'].cuda() # Variable shape: [batch_size, random_seq_len]\n            logits = model(inputs)\n            # No sequence bucketing or allocator tuning leads to OOM after N steps\n            process_output(logits)",
    "solution_desc": "Enable the expandable_segments feature in PyTorch via the PYTORCH_CUDA_ALLOC_CONF environment variable to leverage virtual memory mappings (cuMemMap) without contiguous physical memory requirements. Combine this with length-based bucketing (BucketBatchSampler) and tensor dimension padding to round up sizes to multiples of 8 or 16, preserving cache block reuse.",
    "good_code": "import os\n# Enable virtual memory dynamic segment expansion\nos.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True,max_split_size_mb:128'\n\nimport torch\nfrom torch.utils.data import Sampler\n\nclass LengthBucketSampler(Sampler):\n    \"\"\"Buckets dynamic sequence lengths to minimize reallocation churn.\"\"\"\n    def __init__(self, lengths, batch_size, bucket_size=100):\n        self.batches = []\n        indices = sorted(range(len(lengths)), key=lambda k: lengths[k])\n        for i in range(0, len(indices), batch_size * bucket_size):\n            bucket = indices[i:i + batch_size * bucket_size]\n            for j in range(0, len(bucket), batch_size):\n                self.batches.append(bucket[j:j + batch_size])\n    \n    def __iter__(self):\n        return iter(self.batches)\n    def __len__(self):\n        return len(self.batches)\n\ndef pad_to_multiple(x: torch.Tensor, multiple: int = 8) -> torch.Tensor:\n    pad_len = (multiple - (x.shape[-1] % multiple)) % multiple\n    return torch.nn.functional.pad(x, (0, pad_len))\n\n# Dynamic loop with bucketing and CUDA graph safe execution\n@torch.inference_mode()\ndef run_optimized_batching(model, dataloader):\n    for batch in dataloader:\n        inputs = pad_to_multiple(batch['tokens'].to(device='cuda', non_blocking=True))\n        _ = model(inputs)",
    "verification": "Profile allocation efficiency using `torch.cuda.memory_summary()`. Verify that `reserved_bytes` closely tracks `allocated_bytes` and that the fragmentation metric remains under 10% across extended runs with random input sizes.",
    "date": "2026-10-23",
    "id": 1792763850,
    "type": "error"
});