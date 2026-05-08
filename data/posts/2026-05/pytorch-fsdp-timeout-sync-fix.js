window.onPostDataLoaded({
    "title": "Resolving PyTorch FSDP Collective Communication Timeouts",
    "slug": "pytorch-fsdp-timeout-sync-fix",
    "language": "Python",
    "code": "NCCLTimeout",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Fully Sharded Data Parallel (FSDP) synchronization timeouts usually occur during the gradient reduction phase or all-gather operations. This is frequently seen in multi-node setups where a single slow GPU (straggler) or a network bottleneck causes the NCCL backend to exceed its default 30-minute timeout. Furthermore, if the model has highly non-uniform layer sizes, some ranks may finish their backward pass significantly earlier than others, leading to a perceived hang.</p>",
    "root_cause": "Default NCCL timeout is too aggressive for large-scale sharding, or `limit_all_gathers` is set to False, causing OOM-induced stalls that look like communication timeouts.",
    "bad_code": "model = FSDP(\n    my_module,\n    sharding_strategy=ShardingStrategy.FULL_SHARD\n)\n# Defaults result in 30min timeout and uncapped inflight all-gathers",
    "solution_desc": "Configure the `DistributedDataParallel` process group with an explicit, longer timeout and enable `limit_all_gathers` in the FSDP policy to prevent the GPU from being overwhelmed by concurrent communication tasks.",
    "good_code": "from datetime import timedelta\nfrom torch.distributed.fsdp import FullyShardedDataParallel as FSDP, ShardingStrategy\n\ndist.init_process_group(\n    \"nccl\", \n    timeout=timedelta(seconds=7200)\n)\n\nmodel = FSDP(\n    my_module,\n    sharding_strategy=ShardingStrategy.FULL_SHARD,\n    limit_all_gathers=True,\n    sync_module_states=True\n)",
    "verification": "Monitor logs for 'NCCL INFO: Call to connect() failed' or 'Timeout'. The fix is verified if the training loop completes the first 100 iterations without a collective hang.",
    "date": "2026-05-08",
    "id": 1778206047,
    "type": "error"
});