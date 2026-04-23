window.onPostDataLoaded({
    "title": "Fixing DDP Deadlocks in Heterogeneous GPU Clusters",
    "slug": "pytorch-ddp-deadlock-heterogeneous-gpu",
    "language": "Python",
    "code": "RuntimeError (NCCL Timeout)",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>DistributedDataParallel (DDP) deadlocks often occur in heterogeneous environments where GPUs have varying compute capabilities (e.g., mixing A100s and V100s) or uneven network latency. The primary mechanism for failure is the synchronization barrier; if one rank finishes a forward pass significantly faster than others, but the collective communication (like AllReduce) is triggered out of order or with incompatible gradients, the NCCL backend hangs indefinitely.</p>",
    "root_cause": "Race conditions in gradient reduction triggered by find_unused_parameters=True and asymmetric processing speeds, leading to out-of-sync NCCL collective calls.",
    "bad_code": "model = DistributedDataParallel(model, device_ids=[rank])\n# No timeout or async error handling\n# Unused parameters causing unnecessary reduction overhead\noutput = model(input)\nloss = criterion(output, target)\nloss.backward()",
    "solution_desc": "Set NCCL_ASYNC_ERROR_HANDLING=1 to catch timeouts and implement a robust process group initialization with a specific timeout. Ensure find_unused_parameters is False if all parameters are used, and use join() context managers for uneven batch sizes.",
    "good_code": "import datetime\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ndist.init_process_group(\n    backend='nccl', \n    timeout=datetime.timedelta(seconds=1800),\n    init_method='env://'\n)\n\nmodel = DDP(model, device_ids=[rank], find_unused_parameters=False)\nwith model.join(): # Handles uneven inputs across ranks\n    output = model(input)\n    loss = criterion(output, target)\n    loss.backward()",
    "verification": "Monitor logs for 'NCCL wrapper: Check error: Network is unreachable' and ensure all ranks reach the optimizer step using torch.cuda.synchronize().",
    "date": "2026-04-23",
    "id": 1776921752,
    "type": "error"
});