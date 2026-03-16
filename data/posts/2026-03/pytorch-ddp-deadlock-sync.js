window.onPostDataLoaded({
    "title": "Resolving PyTorch DDP Deadlocks in Gradient Sync",
    "slug": "pytorch-ddp-deadlock-sync",
    "language": "Python",
    "code": "Deadlock",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) deadlocks frequently occur during the backward pass when gradient synchronization is triggered. This usually happens because different processes (ranks) in the distributed group are executing different code paths. If one rank skips a forward pass for a specific parameter (due to conditional logic), DDP's internal Reducer waits indefinitely for a gradient contribution from that rank that will never arrive, halting the entire training cluster.</p>",
    "root_cause": "Conditional execution in the model's forward method causes some ranks to not use specific parameters, resulting in those parameters never triggering their gradient reduction hooks.",
    "bad_code": "def forward(self, x, rank):\n    if rank == 0:\n        # Parameter 'self.layer2' only used in rank 0\n        return self.layer2(self.layer1(x))\n    return self.layer1(x)",
    "solution_desc": "Set the 'find_unused_parameters' flag to True when initializing the DistributedDataParallel wrapper. This allows PyTorch to identify parameters that don't participate in the forward pass and skip them during the synchronization phase.",
    "good_code": "model = DistributedDataParallel(\n    local_model, \n    device_ids=[gpu_id], \n    find_unused_parameters=True\n)",
    "verification": "Check if the training loop proceeds past the first backward() call on all ranks without timing out or hanging.",
    "date": "2026-03-16",
    "id": 1773637778,
    "type": "error"
});