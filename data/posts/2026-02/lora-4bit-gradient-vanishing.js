window.onPostDataLoaded({
    "title": "Fix 4-bit LoRA Gradient Vanishing",
    "slug": "lora-4bit-gradient-vanishing",
    "language": "Python",
    "code": "GradientVanishing",
    "tags": [
        "Python",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When fine-tuning Large Language Models using 4-bit NormalFloat (NF4) quantization via LoRA, users often observe that the loss stops decreasing early or the gradients become zero. This is primarily caused by the precision mismatch between the 4-bit frozen weights and the 16-bit/32-bit adapter weights.</p><p>The gradient signals can become too small to represent in low-precision formats, or they are effectively 'masked' by the quantization constants during the dequantization step in the backward pass.</p>",
    "root_cause": "Under-scaled LoRA weights relative to the quantized base weights and improper optimizer settings that fail to track small updates in a 4-bit quantized landscape.",
    "bad_code": "from peft import LoraConfig\n\n# Standard config often causes vanishing gradients in 4-bit\nconfig = LoraConfig(\n    r=8, \n    lora_alpha=16, \n    target_modules=[\"q_proj\"], \n    lora_dropout=0.05\n)",
    "solution_desc": "Increase the lora_alpha to ensure higher weight scaling, target more modules (all linear layers), and use a high-precision optimizer like paged_adamw_32bit.",
    "good_code": "from peft import LoraConfig\n\nconfig = LoraConfig(\n    r=16,\n    lora_alpha=32, # Higher alpha for stronger signal\n    target_modules=[\"q_proj\", \"v_proj\", \"k_proj\", \"o_proj\"],\n    lora_dropout=0.1,\n    bias=\"none\"\n)\n# Use bitsandbytes Paged AdamW 32-bit",
    "verification": "Check WandB or TensorBoard logs for 'grad_norm'. A healthy run should show non-zero gradient norms consistently across steps.",
    "date": "2026-02-21",
    "id": 1771665723,
    "type": "error"
});