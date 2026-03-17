window.onPostDataLoaded({
    "title": "Fixing Quantization Divergence in LoRA Fine-Tuning",
    "slug": "fixing-quantization-divergence-lora",
    "language": "Python",
    "code": "WeightDivergence",
    "tags": [
        "Python",
        "Machine Learning",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When fine-tuning large language models using QLoRA, developers often encounter numerical instability where the loss spikes or becomes NaN. This typically occurs because the 4-bit NormalFloat (NF4) quantization creates a precision mismatch between the frozen base weights and the high-precision LoRA adapters. During backpropagation, the gradients flowing through the adapters can cause the adapter weights to scale out of range relative to the quantized base, leading to catastrophic divergence in the model's output distribution.</p>",
    "root_cause": "The mismatch between 4-bit quantized base weights and 16-bit/32-bit adapter weights leads to extreme gradient variance when the learning rate is too high or the LoRA alpha scaling is misconfigured.",
    "bad_code": "from peft import LoraConfig\n\nconfig = LoraConfig(\n    r=64,\n    lora_alpha=16, # Low alpha relative to high rank r\n    target_modules=[\"q_proj\", \"v_proj\"],\n    lora_dropout=0.05,\n    bias=\"none\",\n    task_type=\"CAUSAL_LM\"\n)\n# Training with high LR (e.g., 2e-4) leads to NaN loss",
    "solution_desc": "Implement LoFTQ (Lossless Fine-Tuning Quantization) to initialize adapters based on quantization error, and ensure the lora_alpha is set to 2x the rank (r) for stable scaling. Additionally, use gradient clipping and a smaller learning rate with a cosine scheduler.",
    "good_code": "from peft import LoraConfig, LoftQConfig\n\nloftq_config = LoftQConfig(loftq_bits=4, iter=5)\n\nconfig = LoraConfig(\n    r=64,\n    lora_alpha=128, # Set to 2 * r for stability\n    target_modules=[\"q_proj\", \"k_proj\", \"v_proj\", \"o_proj\"],\n    loftq_config=loftq_config, # Initializing with quantization error\n    learning_rate=5e-5, # Reduced LR\n    gradient_clipping=1.0\n)",
    "verification": "Monitor the loss curve in Weights & Biases; it should show a smooth exponential decay without sudden spikes or NaN values during the first 100 steps.",
    "date": "2026-03-17",
    "id": 1773730434,
    "type": "error"
});