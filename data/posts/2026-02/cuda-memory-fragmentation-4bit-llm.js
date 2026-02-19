window.onPostDataLoaded({
    "title": "Resolving CUDA Memory Fragmentation in 4-bit LLMs",
    "slug": "cuda-memory-fragmentation-4bit-llm",
    "language": "Python",
    "code": "CudaOutOfMemory",
    "tags": [
        "Python",
        "Machine Learning",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>When running 4-bit quantized LLMs (using bitsandbytes or AutoGPTQ), memory fragmentation occurs because the CUDA allocator struggles with the varying sizes of de-quantized activation tensors and the fixed-size quantized weights. This 'External Fragmentation' means that while total free memory is sufficient, there is no single contiguous block large enough for the next allocation, resulting in a false OOM error.</p>",
    "root_cause": "Frequent allocation and deallocation of small intermediate tensors during 4-bit dequantization combined with the default PyTorch caching allocator behavior.",
    "bad_code": "import torch\nfrom transformers import AutoModelForCausalLM\n\n# Standard loading often fails during long context generation\nmodel = AutoModelForCausalLM.from_pretrained(\n    \"model_path\", \n    load_in_4bit=True, \n    device_map=\"auto\"\n)\n# Running inference on 4k+ tokens triggers fragmentation OOM",
    "solution_desc": "Configure the PyTorch CUDA allocator to use 'expandable_segments'. This feature, introduced in recent PyTorch versions, allows the allocator to map memory into contiguous virtual address spaces even if the physical segments are non-contiguous, effectively eliminating external fragmentation for LLM workloads.",
    "good_code": "import os\nimport torch\n\n# Enable expandable segments to prevent fragmentation\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True\"\n\nmodel = AutoModelForCausalLM.from_pretrained(\n    \"model_path\", \n    load_in_4bit=True, \n    device_map=\"auto\"\n)\n# Fragments are now virtually contiguous",
    "verification": "Check `torch.cuda.memory_summary()` after long inference runs. The 'Max Reserved' should be significantly closer to 'Max Allocated' than before the fix.",
    "date": "2026-02-19",
    "id": 1771463934,
    "type": "error"
});