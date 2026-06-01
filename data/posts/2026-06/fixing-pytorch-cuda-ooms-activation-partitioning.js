window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA OOMs via Activation Partitioning",
    "slug": "fixing-pytorch-cuda-ooms-activation-partitioning",
    "language": "Python",
    "code": "RuntimeError: CUDA out of memory",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When fine-tuning large language models (LLMs), activation memory is often the primary driver of GPU memory exhaustion. During the forward pass, intermediate activation tensors must be saved in GPU memory so they can be accessed during the backward pass to calculate gradients. For deep models with long sequence lengths, these activations scale quadratically or linearly to unsustainable sizes, leading to the dreaded 'CUDA out of memory' (OOM) error. Activation partitioning (also known as gradient checkpointing) mitigates this by discarding intermediate activations during the forward pass and recalculating them on-the-fly during the backward pass, dramatically reducing the peak memory footprint at the expense of a minor computational overhead (roughly 33%).</p>",
    "root_cause": "The forward pass stores all intermediate activation tensors for the entire network in GPU VRAM, causing memory consumption to exceed physical GPU limits during batch execution of high-parameter LLM layers.",
    "bad_code": "import torch\nimport torch.nn as nn\n\nclass HeavyLLMLayer(nn.Module):\n    def __init__(self, d_model=4096):\n        super().__init__()\n        self.linear1 = nn.Linear(d_model, d_model * 4)\n        self.activation = nn.GELU()\n        self.linear2 = nn.Linear(d_model * 4, d_model)\n\n    def forward(self, x):\n        # Stores all massive activations in memory\n        return self.linear2(self.activation(self.linear1(x)))\n\n# Training Loop\nmodel = nn.Sequential(*[HeavyLLMLayer() for _ in range(32)]).cuda()\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)\nx = torch.randn(8, 2048, 4096).cuda() # Huge batch size/seq len\n\n# This line crashes with CUDA OOM\nloss = model(x).sum()\nloss.backward()\noptimizer.step()",
    "solution_desc": "Implement gradient checkpointing (activation partitioning) using PyTorch's native `torch.utils.checkpoint` module. By wrapping individual layers or transformer blocks in the checkpointing function, we instruct PyTorch not to store the internal activations of those layers during the forward pass. Instead, it recomputes them on the backward pass when processing that specific layer's gradient step.",
    "good_code": "import torch\nimport torch.nn as nn\nfrom torch.utils.checkpoint import checkpoint\n\nclass HeavyLLMLayer(nn.Module):\n    def __init__(self, d_model=4096):\n        super().__init__()\n        self.linear1 = nn.Linear(d_model, d_model * 4)\n        self.activation = nn.GELU()\n        self.linear2 = nn.Linear(d_model * 4, d_model)\n\n    def forward(self, x):\n        # Use checkpointing for internal calculations to drop intermediate activations\n        def custom_forward(tensor):\n            return self.linear2(self.activation(self.linear1(tensor)))\n        return checkpoint(custom_forward, x, use_reentrant=False)\n\n# Training Loop\nmodel = nn.Sequential(*[HeavyLLMLayer() for _ in range(32)]).cuda()\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)\nx = torch.randn(8, 2048, 4096).cuda()\n\n# This runs successfully within compressed memory bounds\nloss = model(x).sum()\nloss.backward()\noptimizer.step()",
    "verification": "Monitor the VRAM utilization dynamically using `nvidia-smi -l 1` or track allocated memory programmatically in Python using `print(torch.cuda.memory_summary())`. You will observe a massive drop in peak memory usage (often up to 60-70% lower activation footprint) compared to the un-checkpointed training run.",
    "date": "2026-06-01",
    "id": 1780281997,
    "type": "error"
});