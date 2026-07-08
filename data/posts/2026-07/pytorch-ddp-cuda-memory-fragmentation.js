window.onPostDataLoaded({
    "title": "Resolving PyTorch DDP CUDA Memory Fragmentation",
    "slug": "pytorch-ddp-cuda-memory-fragmentation",
    "language": "Python",
    "code": "CUDA OOM",
    "tags": [
        "PyTorch",
        "DDP",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>During Distributed Data Parallel (DDP) training in PyTorch, dynamic input shapes (e.g., varying sequence lengths in NLP) trigger frequent recompilations when using torch.compile(). This causes the PyTorch caching allocator to constantly allocate and deallocate GPU memory blocks of varying sizes, leading to severe CUDA memory fragmentation and eventual Out-Of-Memory (OOM) errors despite sufficient total free memory.</p>",
    "root_cause": "Dynamic shape changes trigger constant graph recompilation and unpredictable memory allocation sizes, exhausting the CUDA caching allocator's contiguous blocks.",
    "bad_code": "model = torch.compile(raw_model)\nfor epoch in range(epochs):\n    for x, y in dataloader:\n        # x has dynamic shapes e.g. [batch, seq_len] where seq_len varies\n        out = model(x)",
    "solution_desc": "Pad inputs to static bucket boundaries or use torch.compile(dynamic=True) to hint the compiler to generate a single graph supporting dynamic shapes. Additionally, configure the PyTorch allocator using environment variables to release memory proactively.",
    "good_code": "import os\n# Configure allocator behavior\nos.environ[\"PYTORCH_CUDA_ALLOC_CONF\"] = \"expandable_segments:True\"\n\n# Compile with explicit dynamic shape support\nmodel = torch.compile(raw_model, dynamic=True)",
    "verification": "Run training and profile with torch.cuda.memory_summary() to check for stable active memory usage and zero allocation retries.",
    "date": "2026-07-08",
    "id": 1783475383,
    "type": "error"
});