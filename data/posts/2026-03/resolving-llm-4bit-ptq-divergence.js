window.onPostDataLoaded({
    "title": "Resolving 4-bit PTQ Divergence in LLM Quantization",
    "slug": "resolving-llm-4bit-ptq-divergence",
    "language": "Python",
    "code": "WeightDivergence",
    "tags": [
        "LLM",
        "PyTorch",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>Post-Training Quantization (PTQ) to 4-bit often suffers from significant accuracy degradation compared to 8-bit. This 'divergence' occurs because LLM weights and activations contain high-magnitude outliers. In a 4-bit range (0-15 or -8 to 7), these outliers force the quantization scale to be extremely large, which collapses the resolution of the remaining 99.9% of the values into just 1 or 2 bins.</p>",
    "root_cause": "The presence of emergent high-magnitude outliers in activation channels that exceed the dynamic range of uniform 4-bit quantization, causing massive truncation errors.",
    "bad_code": "import torch\n\n# Naive min-max quantization\ndef naive_quant(x):\n    scale = (x.max() - x.min()) / (2**4 - 1)\n    zero_point = x.min()\n    return torch.round(x / scale + zero_point)",
    "solution_desc": "Implement Activation-aware Weight Quantization (AWQ). Instead of just clipping, we scale up the weights corresponding to the 'salient' activation channels. This effectively reduces the relative impact of outliers without losing the information they carry, allowing the 4-bit grid to represent the distribution more accurately.",
    "good_code": "import torch\n\ndef awq_scaling(weights, activations, alpha=0.5):\n    # Calculate saliency based on activation magnitude\n    saliency = activations.abs().mean(dim=0)\n    scales = saliency.pow(alpha).clamp(min=1e-4)\n    # Scale weights to protect important channels\n    scaled_weights = weights * scales.view(1, -1)\n    return quantize_4bit(scaled_weights) / scales.view(1, -1)",
    "verification": "Compare Perplexity (PPL) on the WikiText-2 dataset; AWQ should show < 1.0 PPL increase vs FP16, whereas naive 4-bit shows > 10.0.",
    "date": "2026-03-09",
    "id": 1773031608,
    "type": "error"
});