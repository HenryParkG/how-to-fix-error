window.onPostDataLoaded({
    "title": "Resolving PyTorch DDP Deadlocks from Bucket Mismatches",
    "slug": "pytorch-ddp-bucket-mismatch-deadlock",
    "language": "Python",
    "code": "RuntimeDeadlock",
    "tags": [
        "Python",
        "PyTorch",
        "Machine Learning",
        "Error Fix"
    ],
    "analysis": "<p>In DistributedDataParallel (DDP) training, PyTorch organizes model parameters into 'buckets' to overlap gradient computation with communication. A deadlock occurs when different ranks (GPUs) traverse the computation graph in inconsistent orders or skip certain sub-modules based on conditional logic. Since DDP expects all ranks to signal gradient readiness for the same bucket in the same sequence, a mismatch leads to one rank waiting indefinitely for a collective communication call (AllReduce) that other ranks never initiate.</p>",
    "root_cause": "Conditional execution paths in the forward pass causing asynchronous gradient reduction triggers that do not align across distributed ranks.",
    "bad_code": "def forward(self, x, rank):\n    # Rank-specific logic causes different parameters to be used\n    if rank == 0:\n        return self.layer_a(x)\n    else:\n        return self.layer_b(x) # Deadlock: Rank 0 waits for layer_b, Rank 1 for layer_a",
    "solution_desc": "Ensure all ranks participate in the same computation graph or use the 'find_unused_parameters=True' flag in the DDP wrapper to ignore parameters that don't contribute to the loss in a specific iteration.",
    "good_code": "model = DistributedDataParallel(\n    model, \n    device_ids=[rank], \n    find_unused_parameters=True\n)",
    "verification": "Monitor training logs for 'Timeout' errors in ProcessGroupNCCL and verify all GPUs maintain >0% utilization during the backward pass.",
    "date": "2026-05-01",
    "id": 1777601237,
    "type": "error"
});