window.onPostDataLoaded({
    "title": "Fixing Numerical Divergence in PTQ-Quantized Transformers",
    "slug": "fixing-ptq-numerical-divergence-transformers",
    "language": "Python / PyTorch",
    "code": "Precision Loss",
    "tags": [
        "AI",
        "Quantization",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>Post-Training Quantization (PTQ) often causes 'scale-drift' where the distribution of activations in large language models shifts significantly, causing numerical divergence. In Transformers, this is primarily caused by 'outlier' features\u2014specific channels in the hidden states with magnitudes 10x-100x larger than others. Standard Min-Max quantization forces a wide range that crushes the precision of the remaining 99% of values to zero, leading to catastrophic accuracy loss.</p>",
    "root_cause": "Static quantization ranges failing to account for high-variance outliers in activation tensors, leading to high quantization noise in sensitive attention layers.",
    "bad_code": "import torch.quantization as quant\n\n# Standard static quantization\nmodel.qconfig = quant.get_default_qconfig('fbgemm')\nquant.prepare(model, inplace=True)\n# Calibration on small dataset\ncalibrate(model, data_loader)\nquant.convert(model, inplace=True)\n# Result: Model outputs NaN or gibberish due to outlier clipping",
    "solution_desc": "Implement 'SmoothQuant' or 'Percentile Clipping'. SmoothQuant migrates the quantization difficulty from activations to weights by applying a smoothing factor, effectively equalizing the range across channels.",
    "good_code": "def apply_smooth_quant(layer, alpha=0.5):\n    # Calculate per-channel scales to smooth activations\n    act_max = layer.activation_max.abs().max(dim=0)[0]\n    weight_max = layer.weight.abs().max(dim=1)[0]\n    \n    scale = (act_max.pow(alpha) / weight_max.pow(1-alpha)).clamp(min=1e-5)\n    \n    layer.weight.mul_(scale.view(1, -1))\n    # Adjust preceding layer or input scaling accordingly\n    return scale",
    "verification": "Compare Perplexity (PPL) between the FP16 and INT8 models. PPL should stay within 0.5-1.0 units of the baseline.",
    "date": "2026-05-11",
    "id": 1778500673,
    "type": "error"
});