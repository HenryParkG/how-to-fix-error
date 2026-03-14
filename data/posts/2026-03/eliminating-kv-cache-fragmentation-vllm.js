window.onPostDataLoaded({
    "title": "Fixing KV Cache Fragmentation in LLM Inference",
    "slug": "eliminating-kv-cache-fragmentation-vllm",
    "language": "Python",
    "code": "MemoryFragmentation",
    "tags": [
        "Python",
        "Machine Learning",
        "PyTorch",
        "Error Fix"
    ],
    "analysis": "<p>In distributed LLM inference, the Key-Value (KV) cache grows dynamically as tokens are generated. Standard memory allocators often reserve contiguous blocks based on the maximum possible sequence length (e.g., 2048 tokens), leading to significant internal fragmentation when actual sequences are shorter. This 'over-provisioning' limits the batch size and system throughput by wasting up to 60-80% of available VRAM.</p>",
    "root_cause": "Static allocation of contiguous memory for KV tensors without accounting for the dynamic and unpredictable nature of autoregressive generation.",
    "bad_code": "def allocate_kv_cache(batch_size, max_seq_len, num_heads, head_dim):\n    # Static allocation wastes memory for short sequences\n    k_cache = torch.zeros((batch_size, max_seq_len, num_heads, head_dim))\n    v_cache = torch.zeros((batch_size, max_seq_len, num_heads, head_dim))\n    return k_cache, v_cache",
    "solution_desc": "Implement a PagedAttention-style mechanism. Instead of contiguous tensors, divide the KV cache into fixed-size physical blocks and use a logical-to-physical mapping table (block table) to manage memory like an OS virtual memory system.",
    "good_code": "class PagedKVCache:\n    def __init__(self, num_blocks, block_size, num_heads, head_dim):\n        self.block_size = block_size\n        # Physical memory is fragmented into blocks\n        self.gpu_cache = torch.empty((num_blocks, block_size, num_heads, head_dim))\n        self.block_table = {} # Logical sequence index -> List of physical blocks\n\n    def get_block(self, seq_id, token_idx):\n        block_idx = token_idx // self.block_size\n        return self.block_table[seq_id][block_idx]",
    "verification": "Monitor GPU memory utilization using 'nvidia-smi'. The fix should show a linear increase in throughput as batch size increases, with nearly zero memory wasted on 'unfilled' sequence slots.",
    "date": "2026-03-14",
    "id": 1773462515,
    "type": "error"
});