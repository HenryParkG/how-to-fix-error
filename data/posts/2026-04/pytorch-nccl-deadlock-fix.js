window.onPostDataLoaded({
    "title": "Resolving NCCL Collective Communication Deadlocks",
    "slug": "pytorch-nccl-deadlock-fix",
    "language": "Python",
    "code": "RuntimeError",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>In multi-node PyTorch training using the DistributedDataParallel (DDP) API, NCCL deadlocks often manifest as training processes hanging indefinitely without throwing an immediate error. This typically happens when the collective communication graph becomes desynchronized across different ranks. When one rank enters a collective operation (like <code>all_reduce</code>) while another rank is stuck in a different computation or enters a different collective, the NCCL communicator waits for a handshake that never arrives.</p>",
    "root_cause": "The specific failure is often caused by mismatched conditional logic across ranks (divergent control flow) or network timeouts where a single node fails to report its state, causing the entire communicator ring to block.",
    "bad_code": "import torch.distributed as dist\n\n# Rank-dependent condition causes deadlock\nif dist.get_rank() == 0:\n    # Only rank 0 performs this, others wait at the next global sync\n    dist.all_reduce(tensor)\n\n# All ranks reach here, but rank 0 is already 'ahead' or 'behind'\ndist.barrier()",
    "solution_desc": "Ensure all collective operations are called by every rank in the process group in the exact same order. Use NCCL_BLOCKING_WAIT=1 to force an error instead of a hang, and implement timeout-aware process group initialization.",
    "good_code": "import os\nimport torch.distributed as dist\nfrom datetime import timedelta\n\n# Enable blocking wait to debug hangs\nos.environ[\"NCCL_BLOCKING_WAIT\"] = \"1\"\n\ndist.init_process_group(\n    backend=\"nccl\",\n    timeout=timedelta(seconds=30)\n)\n\n# Ensure every rank participates in the collective\ndist.all_reduce(tensor)\ndist.barrier()",
    "verification": "Set export NCCL_DEBUG=INFO and verify that 'NCCL INFO Call to all_reduce completed' appears for all ranks simultaneously.",
    "date": "2026-04-27",
    "id": 1777277260,
    "type": "error"
});