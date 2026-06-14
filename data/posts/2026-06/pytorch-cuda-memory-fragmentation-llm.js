window.onPostDataLoaded({
    "title": "Fixing PyTorch CUDA Fragmentation in Dynamic LLMs",
    "slug": "pytorch-cuda-memory-fragmentation-llm",
    "language": "Python",
    "code": "CUDA Out of Memory (OOM)",
    "tags": [
        "Python",
        "PyTorch",
        "CUDA",
        "LLM",
        "Error Fix"
    ],
    "analysis": "<p>When executing autoregressive LLM inference with dynamic sequence lengths, the PyTorch caching allocator suffers from extreme memory fragmentation. In dynamic-shape inference, model inputs (such as KV cache tensors and intermediate attention matrices) continuously scale up and down. Because PyTorch's allocator groups memory allocations into fixed-size bins, frequent allocation and deallocation of variable-sized tensors leave the GPU with many small, non-contiguous free memory chunks. Consequently, when a large contiguous memory block is requested for a new generation step, the allocator fails to find a single fitting block and throws a premature Out of Memory (OOM) error, even if the total pool of free GPU memory is more than sufficient.</p>",
    "root_cause": "The PyTorch CUDA caching allocator splits large blocks to satisfy small requests. For dynamic shapes, these split blocks are held in pool buckets. Without memory defragmentation, the allocator cannot merge adjacent free segments if they are held by active references, creating a highly fragmented address space.",
    "bad_code": "import torch\nimport os\n\n# Dynamic shape simulation without allocator tuning\ndef dynamic_llm_inference_step(model, inputs):\n    # Variable sequence lengths generate unpredictable intermediate tensor shapes\n    for seq_len in [512, 1024, 256, 2048, 128]:\n        x = torch.randn(8, seq_len, 4096, device='cuda', dtype=torch.float16)\n        # Dynamic attention weight calculations produce massive transient allocations\n        attn = torch.matmul(x, x.transpose(-1, -2))\n        loss = attn.sum()\n        del x, attn\n        # High frequency of dynamic allocations causes severe fragmentation OOM",
    "solution_desc": "Configure the PyTorch CUDA memory allocator programmatically before initialization. By setting the environment variable 'PYTORCH_CUDA_ALLOC_CONF' to use 'expandable_segments:True' and adjusting 'max_split_size_mb', PyTorch will allocate GPU memory using virtual memory management (via cuMemMap), which maps non-contiguous physical blocks into a contiguous virtual address space, eliminating fragmentation OOMs.",
    "good_code": "import os\nimport torch\n\n# Must configure the allocator configuration prior to any CUDA operations\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True,max_split_size_mb:128\"\n\n# Verify configuration is active\nassert \"expandable_segments:True\" in os.environ.get(\"PYTORCH_CUDA_ALLOC_CONF\", \"\")\n\ndef dynamic_llm_inference_step_optimized(model, inputs):\n    # PyTorch will now map non-contiguous physical memory pages into a unified \n    # virtual address space, bypassing physical fragmentation constraints.\n    for seq_len in [512, 1024, 256, 2048, 128]:\n        with torch.inference_mode():\n            x = torch.randn(8, seq_len, 4096, device='cuda', dtype=torch.float16)\n            attn = torch.matmul(x, x.transpose(-1, -2))\n            loss = attn.sum()\n            del x, attn\n            # Clean up cache aggressively if needed\n            torch.cuda.empty_cache()",
    "verification": "Run the inference loop with extreme variance in sequence lengths. Track memory allocation using torch.cuda.memory_stats() and verify that 'active_bytes.all.current' remains close to 'reserved_bytes.all.current', proving fragmentation has been eliminated.",
    "date": "2026-06-14",
    "id": 1781404991,
    "type": "error"
});