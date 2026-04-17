window.onPostDataLoaded({
    "title": "Fixing CUDA OOM in PagedAttention KV-Cache Resizing",
    "slug": "cuda-oom-pagedattention-resizing",
    "language": "Python",
    "code": "CUDA Runtime Error: Out of Memory",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>PagedAttention manages Key-Value (KV) caches by partitioning them into fixed-size blocks. During LLM inference, if the context window grows dynamically beyond the pre-allocated block pool, the system attempts to resize the cache. If the GPU memory is already fragmented or fully utilized by model weights, this allocation fails, causing a hard crash.</p>",
    "root_cause": "Lack of strict memory headroom for the block allocator and failure to account for memory fragmentation during high-concurrency inference requests.",
    "bad_code": "# Aggressive cache allocation without headroom\ncache_config = CacheConfig(block_size=16, gpu_memory_utilization=0.99)\nengine = LLMEngine.from_model_config(model_cfg, cache_config)",
    "solution_desc": "Lower the 'gpu_memory_utilization' parameter to leave a buffer for overhead (like temporary activation tensors) and implement proactive block eviction or request queuing when the KV-cache pressure exceeds 90%.",
    "good_code": "# Reserve 10% memory for runtime overhead\ncache_config = CacheConfig(\n    block_size=16, \n    gpu_memory_utilization=0.85, \n    swap_space=4 # GB\n)\nengine = vLLM.Engine(config=cache_config)",
    "verification": "Monitor 'nvidia-smi' during peak inference and ensure 'Allocated' memory stays below the reserved limit without spikes during sequence expansion.",
    "date": "2026-04-17",
    "id": 1776403309,
    "type": "error"
});