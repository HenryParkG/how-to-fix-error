window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Deadlocks in Async Collectives",
    "slug": "pytorch-ddp-deadlocks-async-collectives",
    "language": "Python",
    "code": "RuntimeError (Deadlock)",
    "tags": [
        "Python",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) in PyTorch requires strict synchronization across all participant ranks. When developers mix asynchronous collective operations (like dist.all_reduce with async_op=True) with standard DDP communication hooks, a race condition occurs. If one rank proceeds to the next barrier while another is still processing an unawaited async handle, the NCCL/Gloo backend enters an inconsistent state, resulting in a permanent hang or deadlock during the backward pass.</p>",
    "root_cause": "Mismatched collective communication sequences across ranks where an asynchronous operation handle is not explicitly synchronized using .wait() before the next blocking collective call.",
    "bad_code": "import torch.distributed as dist\n# Inside training loop\nhandle = dist.all_reduce(loss, async_op=True)\n# Deadlock occurs because the next DDP step starts before handle finishes\nloss.backward()",
    "solution_desc": "Always call .wait() on the Work object returned by asynchronous collective operations. Alternatively, use torch.cuda.synchronize() to ensure all GPU kernels for the collective are finished before proceeding to the gradient reduction step.",
    "good_code": "import torch.distributed as dist\n# Correct async usage\nhandle = dist.all_reduce(loss, async_op=True)\nhandle.wait() # Ensure completion\nloss.backward()",
    "verification": "Run training with environment variable 'TORCH_DISTRIBUTED_DEBUG=DETAIL' and confirm that all ranks reach the 'post-backward' hook simultaneously.",
    "date": "2026-02-26",
    "id": 1772088580,
    "type": "error"
});