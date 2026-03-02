window.onPostDataLoaded({
    "title": "Fixing Non-Deterministic Deadlocks in PyTorch DDP",
    "slug": "pytorch-ddp-bucket-rebuilding-deadlock",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) in PyTorch works by wrapping models and synchronizing gradients during the backward pass. A known but elusive issue occurs when the computational graph changes between ranks or iterations. PyTorch optimizes communication by 'bucketing' gradients. After the first iteration, DDP 'rebuilds' these buckets based on the observed order of parameter usage. If control flow diverges (e.g., an <code>if</code> statement based on rank-specific data), the order of parameter registration will differ, leading to ranks waiting for gradient synchronization hooks that are never triggered on other ranks.</p>",
    "root_cause": "Divergent execution paths across ranks cause a mismatch in the order or presence of parameters in the autograd graph during the bucket rebuilding phase.",
    "bad_code": "def forward(self, x, rank):\n    x = self.layer1(x)\n    # Divergent control flow causes different ranks\n    # to skip different parameters\n    if rank == 0:\n        x = self.layer2(x)\n    else:\n        x = self.layer3(x)\n    return x",
    "solution_desc": "Set 'find_unused_parameters=True' in the DDP constructor to allow the system to identify parameters that don't participate in the backward pass, or refactor the model to ensure a static graph execution across all ranks.",
    "good_code": "model = DistributedDataParallel(\n    model, \n    device_ids=[rank], \n    find_unused_parameters=True\n)",
    "verification": "Check if training proceeds past the second iteration (where bucket rebuilding occurs) without 'ProcessGroupNCCL' timeouts.",
    "date": "2026-03-02",
    "id": 1772414117,
    "type": "error"
});