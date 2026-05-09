window.onPostDataLoaded({
    "title": "Mitigating Gradient Vanishing in 4-bit LoRA",
    "slug": "fix-gradient-vanishing-4bit-lora",
    "language": "Python",
    "code": "GradientVanishing",
    "tags": [
        "Python",
        "Machine Learning",
        "Next.js",
        "Error Fix"
    ],
    "analysis": "<p>When fine-tuning LLMs using 4-bit quantization (QLoRA), the frozen base weights are represented in a low-precision NormalFloat4 (NF4) format. If the LoRA adapter's initialization or scaling is too aggressive, the gradients can vanish because the high-precision updates are essentially 'lost' when interacting with the quantized base weights during the backward pass.</p>",
    "root_cause": "Improper scaling of the 'lora_alpha' parameter relative to the rank (r) and the use of standard initialization distributions that don't account for the truncated range of 4-bit weights.",
    "bad_code": "config = LoraConfig(\n    r=64,\n    lora_alpha=16, # Alpha too low for high rank\n    target_modules=['q_proj', 'v_proj'],\n    lora_dropout=0.05\n)",
    "solution_desc": "Implement Rank-Stabilized LoRA (rsLoRA) where the scaling factor is calculated as alpha / sqrt(r). Additionally, ensure the optimizer uses a higher precision (32-bit) for state tracking even when weights are 4-bit.",
    "good_code": "config = LoraConfig(\n    r=64,\n    lora_alpha=128, # Rule: alpha = 2 * r or use rsLoRA\n    use_rslora=True, \n    target_modules=['q_proj', 'v_proj'],\n    quantization_config=BitsAndBytesConfig(load_in_4bit=True)\n)",
    "verification": "Check training logs for gradient norms; if norms are < 1e-5, increase lora_alpha or enable rsLoRA.",
    "date": "2026-05-09",
    "id": 1778320852,
    "type": "error"
});