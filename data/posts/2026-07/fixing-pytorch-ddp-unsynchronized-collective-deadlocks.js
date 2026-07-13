window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP Unsynchronized Collective Deadlocks",
    "slug": "fixing-pytorch-ddp-unsynchronized-collective-deadlocks",
    "language": "Python",
    "code": "PyTorch DDP Deadlock",
    "tags": [
        "Python",
        "Backend",
        "Distributed-Training",
        "Error Fix"
    ],
    "analysis": "<p>In PyTorch Distributed Data Parallel (DDP) setups, collective communication operations (like <code>dist.all_reduce</code>, <code>dist.broadcast</code>, or evaluation synchronization barriers) require every single process rank in the distributed process group to participate. If a training script branches conditionally based on local variables (such as dynamic batch size validation, early stopping, or anomalous data filters), one rank may execute a collective communication call while another bypasses it. When this occurs, the active ranks will wait indefinitely for the missing ranks to enter the collective operation, resulting in a silent and unrecoverable deadlock in multi-node training clusters.</p>",
    "root_cause": "The NCCL or Gloo backend blocks execution threads waiting for a handshake from all worker ranks defined in the process group. When ranks branch off due to unsynchronized, rank-local conditions, some ranks skip the collective call while others block on it, causing a classic distributed system synchronization deadlock.",
    "bad_code": "import torch\nimport torch.distributed as dist\nimport torch.nn as nn\n\nclass SimpleModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc = nn.Linear(10, 1)\n\ndef train_step(model, rank, data, target, loss_threshold):\n    output = model(data)\n    loss = torch.nn.functional.mse_loss(output, target)\n    \n    # DANGEROUS: Rank-local check causing unsynchronized branching\n    if loss.item() > loss_threshold:\n        print(f\"Rank {rank} triggered heavy logging and sync\")\n        # Deadlock: Not all ranks will hit this branch!\n        dist.all_reduce(loss)\n        return loss\n    return loss",
    "solution_desc": "To fix this, eliminate rank-local branching for collective operations. If a condition is evaluated locally, use <code>dist.all_gather</code> or <code>dist.all_reduce</code> to aggregate the condition status across all ranks first. Then, make a unified global branching decision based on the synchronized global state, ensuring all ranks call or bypass the collective communication synchronously.",
    "good_code": "import torch\nimport torch.distributed as dist\nimport torch.nn as nn\n\nclass SimpleModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc = nn.Linear(10, 1)\n\ndef train_step(model, rank, data, target, loss_threshold):\n    output = model(data)\n    loss = torch.nn.functional.mse_loss(output, target)\n    \n    # Evaluate local condition\n    local_trigger = torch.tensor([1.0 if loss.item() > loss_threshold else 0.0], device=data.device)\n    \n    # Synchronize decisions: Sum local triggers across all ranks\n    dist.all_reduce(local_trigger, op=dist.ReduceOp.SUM)\n    \n    # If any rank triggered the condition, all ranks participate in the collective operation\n    if local_trigger.item() > 0.0:\n        # Synchronized execution across all ranks prevents deadlocks\n        dist.all_reduce(loss, op=dist.ReduceOp.SUM)\n        loss_val = loss / dist.get_world_size()\n        return loss_val\n    \n    return loss",
    "verification": "Set the environment variables TORCH_DISTRIBUTED_DEBUG=DETAIL and NCCL_DEBUG=INFO. Execute the training script on a multi-node cluster and confirm that collective operations complete without hanging, and verify from debug logs that all ranks enter and exit communication phases simultaneously.",
    "date": "2026-07-13",
    "id": 1783934793,
    "type": "error"
});