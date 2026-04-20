window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Gradient Bucket Deadlocks",
    "slug": "pytorch-ddp-gradient-deadlocks",
    "language": "Python",
    "code": "RuntimeError: Expected to have finished reduction",
    "tags": [
        "Python",
        "PyTorch",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Distributed Data Parallel (DDP) in PyTorch synchronizes gradients by hooking into the backward pass. If certain parameters in your model are not used to calculate the loss (e.g., conditional branches in the forward pass), their gradients are never computed. This causes the all-reduce communication buckets to wait indefinitely for gradients that will never arrive, resulting in a deadlock or a 'reduction not finished' error.</p>",
    "root_cause": "Conditional execution in the forward pass leaves some parameters out of the computation graph, preventing the corresponding DDP buckets from triggering their all-reduce operation.",
    "bad_code": "def forward(self, x, skip_layer=False):\n    x = self.layer1(x)\n    if not skip_layer:\n        x = self.layer2(x)\n    return x",
    "solution_desc": "Initialize the DDP wrapper with 'find_unused_parameters=True'. This allows PyTorch to traverse the graph and identify parameters that won't contribute to the gradient, allowing the buckets to proceed without them.",
    "good_code": "model = DistributedDataParallel(\n    model, \n    device_ids=[rank], \n    find_unused_parameters=True\n)",
    "verification": "Check if training proceeds past the first backward pass without hanging and verify that GPU utilization is consistent across all ranks.",
    "date": "2026-04-20",
    "id": 1776680875,
    "type": "error"
});