window.onPostDataLoaded({
    "title": "Resolving PyTorch NCCL Deadlocks in Distributed LLM Training",
    "slug": "pytorch-nccl-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError: NCCL Error 2",
    "tags": [
        "Python",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In distributed Large Language Model (LLM) training, PyTorch relies on the NCCL (NVIDIA Collective Communications Library) backend for multi-GPU synchronization. Deadlocks typically occur when collective operations like <code>all_reduce</code> or <code>broadcast</code> are called inconsistently across different ranks (processes). Because CUDA kernels are launched asynchronously, a hang in one rank might not manifest until minutes later, making debugging difficult. This is often exacerbated by uneven data sharding where one rank receives a different number of batches than others.</p>",
    "root_cause": "The primary cause is rank divergence\u2014where a specific GPU rank fails to reach a collective communication barrier due to an unhandled exception or conditional logic mismatch, causing all other ranks to wait indefinitely.",
    "bad_code": "import torch.distributed as dist\n\n# Potential deadlock: Rank 0 might skip this if it encounters a data error\nfor data in data_loader:\n    outputs = model(data)\n    loss = criterion(outputs, labels)\n    loss.backward()\n    # If one rank finishes its loop early, others will hang here\n    dist.all_reduce(model.parameters().grad)",
    "solution_desc": "Implement robust error handling using environment variables to detect timeouts and use 'join' contexts for uneven inputs. Set NCCL_ASYNC_ERROR_HANDLING=1 to allow the process to catch and report NCCL errors rather than hanging the entire kernel.",
    "good_code": "import os\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\nos.environ['NCCL_ASYNC_ERROR_HANDLING'] = '1'\nos.environ['NCCL_BLOCKING_WAIT'] = '1'\n\n# Use the DistributedDataParallel join context manager to handle uneven sharding\nwith model.join():\n    for data in data_loader:\n        optimizer.zero_grad()\n        outputs = model(data)\n        loss = criterion(outputs, labels)\n        loss.backward()\n        optimizer.step()",
    "verification": "Enable 'NCCL_DEBUG=INFO' and monitor logs. Verify that rank timeouts trigger a controlled shutdown rather than a silent hang.",
    "date": "2026-03-18",
    "id": 1773796826,
    "type": "error"
});