window.onPostDataLoaded({
    "title": "Fix PyTorch CUDA Fragmentation & LLM OOMs",
    "slug": "fix-pytorch-cuda-fragmentation-llm-oom",
    "language": "PyTorch",
    "code": "CUDA out of memory",
    "tags": [
        "Python",
        "PyTorch",
        "LLM",
        "Deep Learning",
        "Error Fix"
    ],
    "analysis": "<p>When fine-tuning Large Language Models (LLMs) with dynamic sequence lengths, the PyTorch CUDA caching allocator frequently triggers Out Of Memory (OOM) errors even when total allocated memory is well below the GPU's capacity. This paradox is driven by memory fragmentation. PyTorch allocates GPU memory in pools of blocks; when variable-length inputs prompt frequent allocation and deallocation of activations, these blocks become highly fragmented. Consequently, the allocator cannot find a single contiguous block of memory large enough for a incoming heavy tensor (like attention projection matrices), prompting a false OOM.</p><p>By default, PyTorch's caching allocator attempts to minimize overhead by retaining allocated segments. However, under high-throughput training patterns with techniques like LoRA or QLoRA, memory allocations alternate between tiny metadata/KV-cache updates and massive activation maps, leading to severe external fragmentation.</p>",
    "root_cause": "The allocator splits large memory blocks to satisfy smaller requests, but cannot easily coalesce non-contiguous free blocks back together. When a large contiguous allocation is requested, the allocator fails, despite the aggregate free memory being sufficient.",
    "bad_code": "import torch\nfrom transformers import AutoModelForCausalLM, AutoTokenizer\n\n# Standard training setup without allocator tuning\nmodel = AutoModelForCausalLM.from_pretrained(\"meta-llama/Llama-2-7b-hf\", device_map=\"auto\")\ntokenizer = AutoTokenizer.from_pretrained(\"meta-llama/Llama-2-7b-hf\")\n\n# Variable batch and sequence length loading\ndef train_step(batch_inputs):\n    # This loop generates highly variable tensor shapes, accelerating fragmentation\n    outputs = model(**batch_inputs)\n    loss = outputs.loss\n    loss.backward()\n    torch.cuda.empty_cache() # Triggers overhead without solving structural fragmentation",
    "solution_desc": "Configure PyTorch's memory allocator using the `PYTORCH_CUDA_ALLOC_CONF` environment variable. By setting `max_split_size_mb`, we prevent the allocator from splitting blocks larger than the specified threshold, which ensures large contiguous spaces remain available. Additionally, implementing gradient checkpointing reduces the size of persistent activation blocks, minimizing the allocation variance.",
    "good_code": "import os\n# Must be set BEFORE torch is imported or initialized\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"max_split_size_mb:128\"\n\nimport torch\nfrom transformers import AutoModelForCausalLM, AutoTokenizer\n\nmodel = AutoModelForCausalLM.from_pretrained(\"meta-llama/Llama-2-7b-hf\", torch_dtype=torch.float16, device_map=\"cuda:0\")\n# Enable gradient checkpointing to reduce activation memory footprints\nmodel.gradient_checkpointing_enable()\n\ndef train_step_optimized(batch_inputs):\n    # Ensure tensors are cleaned up systematically\n    with torch.cuda.amp.autocast():\n        outputs = model(**batch_inputs)\n        loss = outputs.loss\n    loss.backward()\n    \n    # Prevent memory hoarding across backward passes safely\n    torch.cuda.nvtx.range_push(\"step_cleanup\")\n    del outputs, loss\n    torch.cuda.nvtx.range_pop()",
    "verification": "Run your fine-tuning pipeline and query `torch.cuda.memory_summary(device=None, abbreviated=False)`. Verify that the 'inactive_split_bytes' metric remains consistently near zero, and monitor that the GPU memory usage profile visualizes fewer, more uniform segments.",
    "date": "2026-05-30",
    "id": 1780106963,
    "type": "error"
});