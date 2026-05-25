window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA OOM in Gradient Checkpointing",
    "slug": "pytorch-cuda-oom-gradient-checkpointing",
    "language": "Python",
    "code": "CUDA OOM",
    "tags": [
        "Python",
        "PyTorch",
        "CUDA",
        "Error Fix"
    ],
    "analysis": "<p>When training large deep learning models in mixed-precision (FP16 or BF16) using PyTorch, developers often utilize gradient checkpointing to save GPU memory by trading compute for memory. However, combining gradient checkpointing with Automatic Mixed Precision (AMP) can trigger silent Out-Of-Memory (OOM) failures. This occurs because the standard checkpointing mechanism does not preserve or re-enter the autocast precision context correctly during the backward pass re-evaluation, leading to tensors being cast back to higher-precision FP32 and overflowing CUDA memory allocations.</p>",
    "root_cause": "By default, PyTorch's legacy gradient checkpointing (`use_reentrant=True`) does not preserve the AMP autocast state during the backward re-evaluation step. This forces backward operations to run in default FP32 precision, which drastically inflates the intermediate activation memory footprint and triggers CUDA OOM.",
    "bad_code": "import torch\nfrom torch.utils.checkpoint import checkpoint\n\nclass BadBlock(torch.nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.layer = torch.nn.Linear(8192, 8192)\n\n    def forward(self, x):\n        # Buggy: legacy reentrant checkpointing ignores the AMP context in backward pass\n        return checkpoint(self.layer, x)",
    "solution_desc": "Upgrade to the modern checkpoint API with `use_reentrant=False` which natively preserves autocast context scopes across forward and backward execution phases, keeping activations in FP16/BF16 throughout.",
    "good_code": "import torch\nfrom torch.utils.checkpoint import checkpoint\n\nclass GoodBlock(torch.nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.layer = torch.nn.Linear(8192, 8192)\n\n    def forward(self, x):\n        # Setting use_reentrant=False guarantees preservation of AMP autocast precision\n        return checkpoint(\n            self.layer,\n            x,\n            use_reentrant=False\n        )",
    "verification": "Profile the active GPU memory using `torch.cuda.memory_allocated()` or `nvidia-smi` during backpropagation training loops, verifying that the memory footprint stays low and constant instead of spiking during backward passes.",
    "date": "2026-05-25",
    "id": 1779676570,
    "type": "error"
});