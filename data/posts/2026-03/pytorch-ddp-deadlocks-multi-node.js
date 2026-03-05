window.onPostDataLoaded({
    "title": "Resolving PyTorch DDP Deadlocks in Multi-Node Training",
    "slug": "pytorch-ddp-deadlocks-multi-node",
    "language": "Python",
    "code": "NCCL Timeout/Deadlock",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) relies on collective communication (usually NCCL) to synchronize gradients. Deadlocks occur when ranks diverge in their execution path, causing some ranks to wait at a synchronization barrier (like an AllReduce) that other ranks never reach. This is frequently triggered by conditional logic in the forward pass or using different batch sizes that cause some nodes to finish an epoch earlier than others.</p>",
    "root_cause": "Inconsistent computation graph execution across different GPU ranks, leading to mismatched collective communication calls.",
    "bad_code": "def forward(self, x, rank):\n    if rank == 0 and self.training:\n        # Some ranks compute this, others don't\n        x = self.extra_layer(x)\n    return self.main_layers(x)",
    "solution_desc": "Ensure all ranks follow the same execution path for modules registered in DDP. If some parameters are intentionally unused in certain iterations, use the 'find_unused_parameters=True' flag in the DDP constructor, although the most performant fix is ensuring a static execution graph.",
    "good_code": "model = DistributedDataParallel(\n    model, \n    device_ids=[rank], \n    find_unused_parameters=False # Preferred for performance\n)\n\n# Ensure all ranks execute the same operations\ndef forward(self, x):\n    return self.main_layers(x)",
    "verification": "Set the environment variable TORCH_DISTRIBUTED_DEBUG=DETAIL to identify which rank is lagging and which collective call is timing out.",
    "date": "2026-03-05",
    "id": 1772673348,
    "type": "error"
});