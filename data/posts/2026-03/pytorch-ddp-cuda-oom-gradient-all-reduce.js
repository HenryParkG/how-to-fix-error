window.onPostDataLoaded({
    "title": "Mitigating PyTorch CUDA OOM during DDP Gradient All-Reduce",
    "slug": "pytorch-ddp-cuda-oom-gradient-all-reduce",
    "language": "Python",
    "code": "RuntimeError: CUDA out of memory",
    "tags": [
        "Python",
        "Backend",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) in PyTorch uses a process called gradient bucketing to speed up communication. By default, it collects multiple gradients into a single buffer (bucket) before performing an All-Reduce operation. Under high memory pressure\u2014especially with large models like Transformers\u2014this additional buffer allocation can exceed the remaining GPU VRAM.</p><p>This usually happens at the end of the backward pass. Even if the model fits during training, the peak memory usage spike during the synchronization phase triggers the OOM error.</p>",
    "root_cause": "The default 'bucket_cap_mb' (25MB) and the lack of gradient buffer reuse lead to overlapping memory requirements for both the computational graph and the communication buffers.",
    "bad_code": "import torch.nn.parallel as DDP\n# Standard initialization often ignores memory overhead of bucketing\nmodel = DDP(model, device_ids=[rank])",
    "solution_desc": "Reduce the bucket size to decrease the memory peak and enable 'gradient_as_bucket_view' to allow gradients to share memory with the buckets, significantly reducing the memory footprint during All-Reduce.",
    "good_code": "import torch.nn.parallel as DDP\n\nmodel = DDP(\n    model, \n    device_ids=[rank], \n    bucket_cap_mb=10, # Smaller buckets reduce memory spikes\n    gradient_as_bucket_view=True # Gradients share memory with buckets\n)",
    "verification": "Monitor memory usage using 'nvidia-smi' or 'torch.cuda.memory_stats()'. The peak memory should remain flatter during the backward pass synchronization.",
    "date": "2026-03-30",
    "id": 1774834101,
    "type": "error"
});