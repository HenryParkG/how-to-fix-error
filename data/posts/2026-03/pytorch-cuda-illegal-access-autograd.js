window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA Illegal Memory Access in Autograd",
    "slug": "pytorch-cuda-illegal-access-autograd",
    "language": "Python",
    "code": "CUDA_ERROR_ILLEGAL_ADDRESS",
    "tags": [
        "PyTorch",
        "CUDA",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>Illegal Memory Access in custom PyTorch Autograd kernels typically stems from asynchronous execution where the backward pass attempts to access tensors that were either modified in-place or already deallocated. Because CUDA kernels are non-blocking, the error often surfaces several lines after the actual buggy kernel.</p>",
    "root_cause": "The error is caused by indexing out-of-bounds in a custom C++/CUDA extension or trying to access a 'saved_tensor' that was modified in-place during the forward pass, violating the autograd graph integrity.",
    "bad_code": "class MyFunc(torch.autograd.Function):\n    @staticmethod\n    def forward(ctx, x):\n        ctx.save_for_backward(x)\n        return x.mul_(2) # IN-PLACE MODIFICATION: Bad for autograd",
    "solution_desc": "Avoid in-place operations on tensors required for the backward pass. Use .clone() when saving tensors and utilize 'CUDA_LAUNCH_BLOCKING=1' to identify the exact line of failure during debugging.",
    "good_code": "class MyFunc(torch.autograd.Function):\n    @staticmethod\n    def forward(ctx, x):\n        ctx.save_for_backward(x.clone()) # Save a copy\n        return x * 2 # Out-of-place operation",
    "verification": "Set environment variable 'CUDA_LAUNCH_BLOCKING=1' and run the script. If it passes without the 'Illegal Access' signal, the synchronization issue is resolved.",
    "date": "2026-03-10",
    "id": 1773135353,
    "type": "error"
});