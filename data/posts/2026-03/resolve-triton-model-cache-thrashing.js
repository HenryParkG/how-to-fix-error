window.onPostDataLoaded({
    "title": "Resolving Triton Inference Server Model Cache Thrashing",
    "slug": "resolve-triton-model-cache-thrashing",
    "language": "Python",
    "code": "CacheThrashing",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Triton Inference Server manages model lifecycles through a model repository. When operating under high concurrency with a model set larger than the available GPU memory (VRAM), the server may enter a 'cache thrashing' state. In this scenario, the server spends more time loading and unloading model weights from host memory to GPU than actually performing inference, causing request latency to skyrocket and throughput to collapse.</p>",
    "root_cause": "Insufficient VRAM allocation for the model cache and a misconfigured model-control-mode that allows non-stop loading/unloading of models under high request diversity.",
    "bad_code": "tritonserver --model-repository=/models \\\n--model-control-mode=poll \\\n--repository-poll-secs=5",
    "solution_desc": "Set model-control-mode to EXPLICIT and optimize the model_cache_size. Use model-loading policies and increase pinned_memory_pool_byte_size to speed up transfers between RAM and VRAM.",
    "good_code": "tritonserver --model-repository=/models \\\n--model-control-mode=explicit \\\n--pinned-memory-pool-byte-size=1073741824 \\\n--cuda-memory-pool-byte-size=0:1073741824",
    "verification": "Monitor the 'nv_inference_load_time_duration_us' and 'nv_inference_count' metrics to ensure load times are not dominating the execution cycle.",
    "date": "2026-03-02",
    "id": 1772433948,
    "type": "error"
});