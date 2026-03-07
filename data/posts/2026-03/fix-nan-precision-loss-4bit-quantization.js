window.onPostDataLoaded({
    "title": "Fix Precision Loss and NaNs in 4-bit LLM Inference",
    "slug": "fix-nan-precision-loss-4bit-quantization",
    "language": "Python",
    "code": "FloatingPointError",
    "tags": [
        "Python",
        "PyTorch",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Quantizing Large Language Models (LLMs) to 4-bit (NF4/FP4) significantly reduces VRAM usage but introduces rounding errors. In high-throughput environments, these errors can accumulate in the attention mechanism or layer normalization, resulting in 'Not-a-Number' (NaN) outputs. This typically happens when the <code>compute_dtype</code> is mismatched with the quantization grid or when outliers in weights exceed the representable range of the 4-bit format.</p>",
    "root_cause": "The root cause is the overflow of intermediate activations during the dequantization-and-multiply phase, usually because the compute type is set to FP16 instead of BF16, which lacks the dynamic range to handle quantization outliers.",
    "bad_code": "from transformers import BitsAndBytesConfig\n\n# Risky configuration prone to NaNs on Ampere+ GPUs\nq_config = BitsAndBytesConfig(\n    load_in_4bit=True,\n    bnb_4bit_compute_dtype=torch.float16, \n    bnb_4bit_quant_type=\"fp4\"\n)",
    "solution_desc": "Switch the compute data type to bfloat16 to provide a larger exponent dynamic range and use Nested Quantization (Double Quant) to stabilize the constants. Ensure the model uses 'NormalFloat4' (NF4) which is more robust for normally distributed weights.",
    "good_code": "from transformers import BitsAndBytesConfig\nimport torch\n\nq_config = BitsAndBytesConfig(\n    load_in_4bit=True,\n    bnb_4bit_compute_dtype=torch.bfloat16,\n    bnb_4bit_quant_type=\"nf4\",\n    bnb_4bit_use_double_quant=True\n)\n# Model loading with device_map=\"auto\" to balance weights",
    "verification": "Run a benchmark script comparing the perplexity of the 4-bit model against the FP16 baseline and check for non-zero NaN counts in output tensors.",
    "date": "2026-03-07",
    "id": 1772845862,
    "type": "error"
});