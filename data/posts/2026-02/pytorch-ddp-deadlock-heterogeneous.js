window.onPostDataLoaded({
    "title": "Solving PyTorch DDP Deadlocks in Heterogeneous Clusters",
    "slug": "pytorch-ddp-deadlock-heterogeneous",
    "language": "Python",
    "code": "NCCL_TIMEOUT",
    "tags": [
        "Python",
        "Backend",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>When running DistributedDataParallel (DDP) across a cluster with GPUs of varying speeds or interconnect bandwidths, 'all_reduce' operations can deadlock. If one rank finishes its forward pass significantly slower than others, the NCCL watchdog might time out, or the faster ranks might enter a state where they wait indefinitely for the straggler, causing a cluster-wide hang.</p>",
    "root_cause": "Imbalanced computation-to-communication ratios across nodes and lack of a 'Join' context manager to handle uneven batch sizes or processing speeds.",
    "bad_code": "model = DDP(model, device_ids=[rank])\nfor data, target in loader:\n    output = model(data)\n    loss = criterion(output, target)\n    loss.backward()",
    "solution_desc": "Wrap the training loop with the 'dist.join' context manager to handle trailing processes and set a realistic NCCL_TIMEOUT. Additionally, ensure 'find_unused_parameters=False' to reduce overhead if the graph is static.",
    "good_code": "from torch.distributed.algorithms.join import Join\nmodel = DDP(model, device_ids=[rank])\nwith Join([model]):\n    for data, target in loader:\n        optimizer.zero_grad()\n        loss = model(data).sum()\n        loss.backward()\n        optimizer.step()",
    "verification": "Monitor logs for 'NCCL INFO Call to all_reduce completed' and ensure training completes without 'Watchdog timeout' errors.",
    "date": "2026-02-18",
    "id": 1771390146,
    "type": "error"
});