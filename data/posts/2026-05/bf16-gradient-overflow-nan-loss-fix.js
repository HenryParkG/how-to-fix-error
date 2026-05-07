window.onPostDataLoaded({
    "title": "Resolving BF16 Gradient Overflow and NaN Loss in LLMs",
    "slug": "bf16-gradient-overflow-nan-loss-fix",
    "language": "Python",
    "code": "ML/Training",
    "tags": [
        "Python",
        "AI",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>While Bfloat16 (BF16) offers a wider dynamic range than FP16, it is not immune to numerical instability during Large Language Model (LLM) training. NaN (Not a Number) losses often occur when gradients exceed the BF16 maximum value (approx. 3.39e38) or during sensitive operations like Softmax where exponentiation leads to rapid overflow. Unlike FP16, BF16 doesn't usually require loss scaling, which leads many developers to ignore gradient clipping, ultimately resulting in divergent training runs.</p>",
    "root_cause": "High learning rates combined with deep architectures lead to gradient explosions that exceed BF16's range, or weight updates in high-precision (FP32) are not properly cast back, causing divergence.",
    "bad_code": "model.train()\nfor data, target in loader:\n    with torch.cuda.amp.autocast(dtype=torch.bfloat16):\n        output = model(data)\n        loss = criterion(output, target)\n    loss.backward()\n    optimizer.step()",
    "solution_desc": "Implement mandatory gradient norm clipping to cap the magnitude of updates and ensure that 'Master Weights' are maintained in FP32 while only performing the forward/backward passes in BF16. Additionally, use stable initialization schemes like Xavier/Glorot with smaller scaling factors.",
    "good_code": "for data, target in loader:\n    with torch.cuda.amp.autocast(dtype=torch.bfloat16):\n        output = model(data)\n        loss = criterion(output, target)\n    loss.backward()\n    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\n    optimizer.step()\n    optimizer.zero_grad()",
    "verification": "Monitor the gradient norm via Weights & Biases (W&B); the training is stable if the norm stays below the clipping threshold and the loss curve remains monotonic without 'spiking' to NaN.",
    "date": "2026-05-07",
    "id": 1778133178,
    "type": "error"
});