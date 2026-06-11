window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Deadlocks on Gradient Sync",
    "slug": "fixing-pytorch-ddp-bucket-deadlocks",
    "language": "Python",
    "code": "Deadlock",
    "tags": [
        "Python",
        "PyTorch",
        "Machine Learning",
        "Error Fix"
    ],
    "analysis": "<p>When training deep learning models using PyTorch's DistributedDataParallel (DDP), gradient synchronization is performed across multiple GPUs using background communication buckets. A highly frustrating issue is a silent execution hang (deadlock) during the backward pass. This deadlock occurs when dynamic control flow or conditional layers within the model's forward pass cause different ranks to execute different subsets of parameters. Because DDP builds static buckets and expects all ranks to reduce the exact same parameters, mismatched backward graphs leave some ranks waiting indefinitely for synchronization messages that will never be sent by other ranks.</p>",
    "root_cause": "Conditional execution branches in the model forward pass cause dynamic computation graphs, leading to a mismatch between ranks regarding which parameter gradients need to be all-reduced.",
    "bad_code": "import torch\nimport torch.nn as nn\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\nclass DynamicModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.layer1 = nn.Linear(10, 10)\n        self.layer2 = nn.Linear(10, 10)\n\n    def forward(self, x, rank):\n        # BUG: Rank-dependent branching prevents rank 1 from computing gradients for layer2\n        if rank == 0:\n            return self.layer2(self.layer1(x))\n        else:\n            return self.layer1(x)\n\n# Dynamic DDP setup without handling unused parameters\nmodel = DDP(DynamicModel().to(device), device_ids=[rank])",
    "solution_desc": "To fix this issue, wrap the DDP model with the `find_unused_parameters=True` configuration flag. This tells PyTorch to perform an extra graph traversal during the backward pass to identify parameters that were not used in the forward execution graph. DDP will then automatically mark those parameters as ready for all-reduce, preventing ranks from hanging and avoiding deadlocks.",
    "good_code": "import torch\nimport torch.nn as nn\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\nclass DynamicModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.layer1 = nn.Linear(10, 10)\n        self.layer2 = nn.Linear(10, 10)\n\n    def forward(self, x, rank):\n        # Execution branching remains\n        if rank == 0:\n            return self.layer2(self.layer1(x))\n        else:\n            return self.layer1(x)\n\n# FIX: Initialize DDP with find_unused_parameters=True\nmodel = DDP(\n    DynamicModel().to(device), \n    device_ids=[rank],\n    find_unused_parameters=True\n)",
    "verification": "Enable PyTorch's distributed debugging tool by setting the environment variable `TORCH_DISTRIBUTED_DEBUG=DETAIL` and run the model on multiple ranks. Verify that execution completes all training steps without hanging and that no warning logs are generated.",
    "date": "2026-06-11",
    "id": 1781162588,
    "type": "error"
});