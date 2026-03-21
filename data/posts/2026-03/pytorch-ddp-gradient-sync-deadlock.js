window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Deadlocks during Gradient Sync",
    "slug": "pytorch-ddp-gradient-sync-deadlock",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "PyTorch",
        "Distributed",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) expects every process (rank) in the distributed group to participate in the gradient reduction for all parameters. When model logic includes conditional branching (e.g., some layers are skipped based on input), certain ranks may not compute gradients for specific parameters. This causes the 'all-reduce' operation to hang indefinitely as ranks wait for peers that will never send data.</p>",
    "root_cause": "Mismatched computation graphs across different GPU ranks where some parameters are unused in the forward pass of specific ranks, causing a mismatch during the bucketed gradient synchronization.",
    "bad_code": "def forward(self, x, skip_layer=False):\n    x = self.layer1(x)\n    if not skip_layer: # If rank 0 skips and rank 1 doesn't, DDP deadlocks\n        x = self.layer2(x)\n    return x",
    "solution_desc": "Set 'find_unused_parameters=True' in the DDP constructor to allow the runtime to identify and ignore parameters that didn't participate in the forward pass, or ensure all ranks execute the same graph.",
    "good_code": "model = DistributedDataParallel(\n    model, \n    device_ids=[rank], \n    find_unused_parameters=True # Correctly handles unused subgraphs\n)",
    "verification": "Check logs for 'Reducer' heartbeat and ensure the training loop completes the first 10 iterations without timing out in the all-reduce hook.",
    "date": "2026-03-21",
    "id": 1774055477,
    "type": "error"
});