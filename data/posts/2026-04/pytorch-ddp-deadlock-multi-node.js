window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Deadlocks in Multi-Node Training",
    "slug": "pytorch-ddp-deadlock-multi-node",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) deadlocks usually occur when different processes in a cluster reach different points in the execution graph. In multi-node setups, if one rank hits a conditional branch that skips a collective communication call (like a forward or backward pass) while others wait for it, the entire training job hangs indefinitely without a timeout error.</p>",
    "root_cause": "Unbalanced execution paths across ranks where one rank fails to participate in the gradient synchronization (all_reduce) because a layer was conditionally skipped or a local error occurred that wasn't broadcasted.",
    "bad_code": "def forward(self, x, rank):\n    # If rank 0 skips a layer, all other ranks will wait forever\n    # for rank 0's gradients during the backward pass.\n    if rank == 0 and self.training:\n        return self.alternate_path(x)\n    return self.main_path(x)",
    "solution_desc": "Ensure all ranks follow the same execution path for parameters registered in DDP. If dynamic paths are necessary, use the 'find_unused_parameters=True' flag in the DDP constructor and ensure every rank reaches the global barrier or synchronization point.",
    "good_code": "model = DistributedDataParallel(\n    module,\n    device_ids=[local_rank],\n    find_unused_parameters=True,\n    static_graph=False\n)\n\n# Ensure all ranks participate in the same forward logic\noutput = model(input_data)",
    "verification": "Monitor GPU utilization; if it drops to 0% across all nodes while the process remains 'Running', it's a deadlock. Use NCCL_DEBUG=INFO to identify the exact collective call where the hang occurs.",
    "date": "2026-04-26",
    "id": 1777168255,
    "type": "error"
});