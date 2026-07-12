window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA OOM & Memory Fragmentation",
    "slug": "fixing-pytorch-cuda-oom-activation-fragmentation",
    "language": "Python",
    "code": "CUDA_OOM",
    "tags": [
        "Python",
        "Backend",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>During large language model (LLM) fine-tuning, training runs often crash with <code>RuntimeError: CUDA out of memory</code>, even when the theoretical model size and batch size fit within the GPU VRAM. This is primarily caused by activation memory fragmentation. PyTorch's caching allocator reserves memory blocks but fails to merge them back into contiguous chunks, leading to situations where there is enough overall free VRAM, but no single chunk is large enough to allocate the next activation tensor.</p><p>Additionally, storing intermediate activations for the backward pass without utilizing gradient checkpointing or active cache clearing exacerbates the peak memory consumption during the forward pass.</p>",
    "root_cause": "High peak activation memory and fragmentation within PyTorch's native CUDA allocator caching mechanism, caused by dynamic tensor shapes and lack of gradient checkpointing.",
    "bad_code": "import torch\nfrom transformers import AutoModelForCausalLM\n\nmodel = AutoModelForCausalLM.from_pretrained(\"meta-llama/Llama-2-7b-hf\").cuda()\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)\n\n# Buggy training loop with high fragmentation and no memory management\nfor input_ids, targets in dataloader:\n    inputs = input_ids.cuda()\n    outputs = model(inputs)\n    loss = loss_fn(outputs.logits, targets.cuda())\n    loss.backward()\n    optimizer.step()\n    optimizer.zero_grad() # Retains memory allocations longer than necessary",
    "solution_desc": "Configure the PyTorch CUDA allocator using environmental variables to reduce fragmentation, enable gradient checkpointing to reduce activation overhead, and use mixed precision combined with aggressive zero-gradient management.",
    "good_code": "import os\nimport torch\nfrom transformers import AutoModelForCausalLM\n\n# Configure CUDA allocator to mitigate memory fragmentation\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"max_split_size_mb:128\"\n\nmodel = AutoModelForCausalLM.from_pretrained(\"meta-llama/Llama-2-7b-hf\").cuda()\n# Enable gradient checkpointing to save up to 70% activation memory\nmodel.gradient_checkpointing_enable()\n\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)\n\nfor input_ids, targets in dataloader:\n    inputs = input_ids.cuda()\n    # Use mixed precision context\n    with torch.cuda.amp.autocast(dtype=torch.bfloat16):\n        outputs = model(inputs)\n        loss = loss_fn(outputs.logits, targets.cuda())\n    \n    loss.backward()\n    optimizer.step()\n    optimizer.zero_grad(set_to_none=True) # Frees memory instead of keeping zero tensors",
    "verification": "Monitor CUDA allocation using 'torch.cuda.memory_summary()' during training runs and ensure peak allocated VRAM stays below limits without throwing allocator errors.",
    "date": "2026-07-12",
    "id": 1783835285,
    "type": "error"
});