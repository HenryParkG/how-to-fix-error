window.onPostDataLoaded({
    "title": "Debugging PyTorch DDP Deadlocks in Gradient Bucketing",
    "slug": "pytorch-ddp-gradient-deadlock",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) in PyTorch uses gradient bucketing to overlap communication with computation. A deadlock occurs when the computational graph changes dynamically (e.g., conditional layers), causing some ranks to expect a gradient synchronization that other ranks never trigger because they bypassed that specific sub-graph.</p>",
    "root_cause": "Inconsistent computation graphs across different GPU ranks where certain parameters do not participate in the backward pass, causing the AllReduce operation to hang.",
    "bad_code": "import torch.nn as nn\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\nclass DynamicModel(nn.Module):\n    def forward(self, x, skip_layer=False):\n        if skip_layer:\n            return x # Layer 2 gradients are never computed\n        return self.layer2(self.layer1(x))\n\n# Initializing DDP without handling unused parameters\nmodel = DDP(DynamicModel().cuda(), device_ids=[rank])",
    "solution_desc": "Set 'find_unused_parameters=True' in the DDP constructor. This allows DDP to identify parameters that were not part of the graph and proceed with synchronization for the remaining buckets.",
    "good_code": "model = DDP(\n    DynamicModel().cuda(), \n    device_ids=[rank], \n    find_unused_parameters=True\n)",
    "verification": "Monitor the training logs; if the process hangs at the first backward pass, check for unused parameters or use 'TORCH_DISTRIBUTED_DEBUG=DETAIL' to find the exact tensor causing the hang.",
    "date": "2026-02-28",
    "id": 1772251959,
    "type": "error"
});