window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Gradient Bucket Deadlocks",
    "slug": "pytorch-ddp-gradient-deadlocks",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) in PyTorch synchronizes gradients by grouping them into buckets and performing All-Reduce operations. If your model's forward pass has conditional logic where certain parameters are used on Rank 0 but not on Rank 1, the gradient reduction order differs. This causes ranks to wait indefinitely for buckets that will never be filled, leading to a cluster-wide deadlock.</p>",
    "root_cause": "Inconsistent parameter usage across different distributed ranks during the forward pass, leading to out-of-sync gradient reduction buckets.",
    "bad_code": "def forward(self, x, rank):\n    if rank == 0:\n        return self.layer1(x)\n    else:\n        return self.layer2(x) # Deadlock: Rank 0/1 wait for different buckets",
    "solution_desc": "Set 'find_unused_parameters=True' in the DDP wrapper or ensure all parameters participate in the graph. Alternatively, use static graphs if possible to pre-calculate buckets.",
    "good_code": "model = DistributedDataParallel(\n    model, \n    device_ids=[rank], \n    find_unused_parameters=True\n)",
    "verification": "Check if training proceeds past the first backward pass across all ranks without hanging.",
    "date": "2026-02-20",
    "id": 1771550070,
    "type": "error"
});