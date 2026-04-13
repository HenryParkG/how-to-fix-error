window.onPostDataLoaded({
    "title": "Resolving Gradient Divergence in FP8 Training",
    "slug": "fp8-gradient-divergence-fix",
    "language": "Python",
    "code": "FP8 Divergence",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Training Large Language Models (LLMs) using FP8 (8-bit floating point) precision offers significant memory and speed gains but introduces extreme sensitivity to numerical stability. Because FP8 has a much narrower dynamic range than FP16 or BF16, gradients frequently underflow to zero or overflow to infinity. This leads to gradient divergence, where the loss function suddenly spikes to NaN, ruining the training run.</p>",
    "root_cause": "The use of static scaling factors or insufficient precision in the master weight updates during backpropagation when utilizing E4M3/E5M2 formats.",
    "bad_code": "# Standard FP8 cast without dynamic scaling\nmodel = model.to(torch.float8_e4m3fn)\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)\n# Loss quickly becomes NaN",
    "solution_desc": "Implement dynamic loss scaling and utilize per-tensor scaling factors. Ensure that optimizer updates are performed in FP32 (Master Weights) and use specialized libraries like NVIDIA Transformer Engine (TE) to manage the dynamic range of activations and gradients.",
    "good_code": "import transformer_engine.pytorch as te\nfrom transformer_engine.common.recipe import Format, DelayedScaling\n\nrecipe = DelayedScaling(fp8_format=Format.E4M3, amax_history_len=16, amax_compute_algo='max')\nwith te.fp8_autocast(enabled=True, fp8_recipe=recipe):\n    output = model(input)\n    loss = criterion(output, target)\nscaler.scale(loss).backward()",
    "verification": "Monitor the 'amax' (absolute maximum) history of tensors and ensure the loss curve remains stable without sudden vertical spikes or NaN occurrences.",
    "date": "2026-04-13",
    "id": 1776058415,
    "type": "error"
});