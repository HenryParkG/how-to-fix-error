window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Deadlocks in Multi-Node Training",
    "slug": "pytorch-ddp-deadlock-fix",
    "language": "Python",
    "code": "RuntimeDeadlock",
    "tags": [
        "Python",
        "AWS",
        "Machine Learning",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) deadlocks typically occur during the backward pass or during collective communication calls (like all_reduce). In multi-node setups, if one rank (process) reaches a synchronization point while another is stuck in a loop or has crashed, the entire training job hangs indefinitely without a stack trace.</p><p>This often happens when the model graph changes dynamically or when some ranks skip certain layers due to conditional logic, leading to 'unused parameters' that were expected to contribute to the gradient reduction but never did.</p>",
    "root_cause": "Desynchronization of collective communication calls across different ranks, or failure to flag unused parameters in dynamic computation graphs.",
    "bad_code": "import torch.nn.parallel as DDP\n# Bug: find_unused_parameters defaults to False, \n# but the model has conditional paths.\nddp_model = DDP(model, device_ids=[rank])\n\nfor data in dataloader:\n    output = ddp_model(data)\n    loss = criterion(output, target)\n    loss.backward() # Deadlocks here if a layer was skipped",
    "solution_desc": "Set 'find_unused_parameters=True' to allow DDP to ignore layers that weren't involved in the forward pass, and use the 'join()' context manager to handle uneven dataset shards across nodes.",
    "good_code": "from torch.nn.parallel import DistributedDataParallel as DDP\n\nddp_model = DDP(model, \n                device_ids=[rank], \n                find_unused_parameters=True)\n\n# Use join to prevent hangs at the end of an epoch\nwith ddp_model.join():\n    for data in dataloader:\n        optimizer.zero_grad()\n        output = ddp_model(data)\n        loss = criterion(output, target)\n        loss.backward()\n        optimizer.step()",
    "verification": "Monitor GPU utilization; if it stays at 0% across nodes while the process is running, the deadlock persists. Successful fix shows consistent heartbeats in NCCL logs (NCCL_DEBUG=INFO).",
    "date": "2026-05-19",
    "id": 1779157722,
    "type": "error"
});