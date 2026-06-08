window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Dynamic Shape Deadlocks",
    "slug": "pytorch-ddp-dynamic-shape-deadlocks",
    "language": "Python",
    "code": "NCCL_TIMEOUT",
    "tags": [
        "Python",
        "PyTorch",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) relies on synchronizing gradient buckets in a synchronized backward pass across multiple GPU ranks. Collective communication backend engines like NCCL expect identical computation graphs and operations to proceed across all ranks. When executing dynamic-shape training pipelines (e.g., dynamic spatial configurations or variable length sequences), dynamic conditions might cause some ranks to skip particular model layers entirely. When these ranks skip the backward phase of skipped parameters, they fail to participate in the collective gradient reductions, leading to permanent NCCL communication deadlocks.</p>",
    "root_cause": "Asymmetric execution paths across processes. When dynamic input lengths alter the runtime execution path on individual ranks, gradient tensors are not generated for bypassed parameters. The remaining ranks stall indefinitely during all-reduce, waiting for data that will never be sent.",
    "bad_code": "import torch\nimport torch.nn as nn\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\nclass DynamicModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc1 = nn.Linear(10, 10)\n        self.fc2 = nn.Linear(10, 10)\n\n    def forward(self, x):\n        x = self.fc1(x)\n        # Dynamic shape triggers optional branch conditionally across ranks\n        if x.shape[0] > 5:\n            x = self.fc2(x)\n        return x\n\n# Dynamic DDP instantiation without unused parameter checking\nmodel = DDP(DynamicModel().to(device), device_ids=[local_rank])",
    "solution_desc": "Mitigate asymmetric computation graphs by configuring DDP with find_unused_parameters=True, which automatically scans for uncomputed gradients during the forward pass and eliminates them from communication cycles. Additionally, rewrite dynamic computation blocks so that conditional logic applies masks rather than omitting computational stages, maintaining an identical execution path across all GPU instances.",
    "good_code": "import torch\nimport torch.nn as nn\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\nclass ConsistentModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc1 = nn.Linear(10, 10)\n        self.fc2 = nn.Linear(10, 10)\n\n    def forward(self, x):\n        x = self.fc1(x)\n        # Keep computational path identical; apply mathematical masks for dynamics\n        mask = (x.shape[0] > 5)\n        fc2_out = self.fc2(x)\n        x = torch.where(mask, fc2_out, x)\n        return x\n\n# Enable find_unused_parameters to safely handle complex runtime exceptions\nmodel = DDP(\n    ConsistentModel().to(device),\n    device_ids=[local_rank],\n    find_unused_parameters=True\n)",
    "verification": "Set the environment variables `TORCH_DISTRIBUTED_DEBUG=DETAIL` and `NCCL_DEBUG=INFO`. Execute training with varying spatial shapes across GPU nodes and verify that all-reduce operations progress without timeout errors.",
    "date": "2026-06-08",
    "id": 1780923574,
    "type": "error"
});