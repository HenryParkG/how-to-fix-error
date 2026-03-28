window.onPostDataLoaded({
    "title": "Fix PyTorch FSDP Divergence from Precision Mismatch",
    "slug": "pytorch-fsdp-precision-clipping-fix",
    "language": "Python",
    "code": "Gradient Divergence",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Training divergence in PyTorch Fully Sharded Data Parallel (FSDP) often stems from how gradient clipping interacts with mixed-precision sharding. When gradients are sharded across devices, calculating the global norm requires careful synchronization; if clipping is applied using float16 while the optimizer expects float32, or if the norm calculation ignores the sharding factor, gradients can explode or vanish.</p>",
    "root_cause": "Precision mismatch occurs when the ShardedGradScaler incorrectly handles the unscale_() operation before gradient clipping, leading to local clipping on partial gradients instead of global clipping on the reconstructed gradient norm.",
    "bad_code": "model = FSDP(base_model, mixed_precision=mp_policy)\noptimizer = torch.optim.AdamW(model.parameters())\n# WRONG: Clipping sharded gradients locally\ntorch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\noptimizer.step()",
    "solution_desc": "Use the built-in FSDP 'clip_grad_norm_' method which is specifically designed to handle sharded parameters. Ensure that the 'sharded_grad_scaler' is used to maintain precision during the reduction and that clipping happens after the gradients have been unscaled but before the optimizer step.",
    "good_code": "model = FSDP(base_model, mixed_precision=mp_policy)\n# CORRECT: Use FSDP-specific clipping\nmodel.clip_grad_norm_(max_norm=1.0)\noptimizer.step()",
    "verification": "Monitor the 'grad_norm' using a tool like Weights & Biases. If the norm stays consistent across epochs without sharp spikes to NaN/Inf, the precision mismatch is resolved.",
    "date": "2026-03-28",
    "id": 1774680462,
    "type": "error"
});