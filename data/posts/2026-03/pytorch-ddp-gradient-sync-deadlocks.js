window.onPostDataLoaded({
    "title": "Resolving PyTorch DDP Gradient Sync Deadlocks",
    "slug": "pytorch-ddp-gradient-sync-deadlocks",
    "language": "Python",
    "code": "Distributed Deadlock",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) in PyTorch relies on all-reduce operations to synchronize gradients across GPUs. A deadlock occurs when some ranks skip certain layers (e.g., due to conditional logic in the forward pass) while others expect them, causing the communication collective to hang indefinitely as it waits for missing gradient buckets.</p>",
    "root_cause": "Inconsistent computation graphs across different ranks where some parameters do not participate in the gradient calculation, violating NCCL's synchronization order.",
    "bad_code": "def forward(self, x):\n    x = self.layer1(x)\n    if self.training and random.random() > 0.5:\n        x = self.layer2(x) # Rank-dependent execution causes deadlock\n    return x",
    "solution_desc": "Set 'find_unused_parameters=True' in the DDP wrapper. This allows the runtime to detect parameters that don't participate in the forward pass and mark them as ready for reduction manually.",
    "good_code": "from torch.nn.parallel import DistributedDataParallel as DDP\n\nmodel = DDP(model, \n            device_ids=[rank], \n            find_unused_parameters=True)",
    "verification": "Set environment variable 'NCCL_DEBUG=INFO' and verify that 'find_unused_parameters' is reducing all buckets.",
    "date": "2026-03-08",
    "id": 1772932585,
    "type": "error"
});