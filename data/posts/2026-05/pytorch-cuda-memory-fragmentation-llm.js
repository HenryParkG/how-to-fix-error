window.onPostDataLoaded({
    "title": "Mitigating PyTorch CUDA Memory Fragmentation in LLMs",
    "slug": "pytorch-cuda-memory-fragmentation-llm",
    "language": "Python",
    "code": "CUDA_OOM",
    "tags": [
        "Python",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>During LLM fine-tuning, large tensors are frequently allocated and freed. The PyTorch caching allocator can suffer from external fragmentation, where free memory exists but is split into small, non-contiguous blocks. This leads to CUDA Out of Memory (OOM) errors even when the total free memory exceeds the requested allocation size. This is particularly prevalent when using variable sequence lengths or gradient checkpointing.</p>",
    "root_cause": "The allocator's default strategy doesn't consolidate small blocks aggressively enough for the massive, heterogeneous memory demands of LLM attention layers.",
    "bad_code": "import torch\nfrom transformers import AutoModelForCausalLM\n\nmodel = AutoModelForCausalLM.from_pretrained('huge-llm')\n# Standard training loop without memory management\nfor batch in loader:\n    outputs = model(**batch)\n    loss = outputs.loss\n    loss.backward()",
    "solution_desc": "Configure the PyTorch allocator using the 'max_split_size_mb' environment variable to prevent large blocks from being split into unrecoverable fragments, and use 'empty_cache()' strategically.",
    "good_code": "import os\nimport torch\n\n# Prevent fragmentation by setting max split size\nos.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:128'\n\n# Inside training loop\ntorch.cuda.empty_cache()\nmodel.gradient_checkpointing_enable()\noutputs = model(**batch)",
    "verification": "Monitor memory using 'torch.cuda.memory_summary()' and check for a high 'segment_count' relative to total memory usage.",
    "date": "2026-05-04",
    "id": 1777892218,
    "type": "error"
});