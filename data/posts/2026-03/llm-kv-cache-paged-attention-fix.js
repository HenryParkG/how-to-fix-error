window.onPostDataLoaded({
    "title": "Fixing KV Cache Fragmentation in PagedAttention",
    "slug": "llm-kv-cache-paged-attention-fix",
    "language": "Python",
    "code": "KVCacheFragmentation",
    "tags": [
        "Python",
        "AI",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Large Language Model (LLM) serving often suffers from memory waste due to the Key-Value (KV) cache. Traditional implementations allocate contiguous memory for the maximum possible sequence length, leading to internal fragmentation (unused space) and external fragmentation.</p><p>PagedAttention, popularized by vLLM, solves this by partitioning the KV cache into non-contiguous physical blocks. However, misconfigured block sizes or improper mapping logic can still lead to 'bubble' waste where the tail of a sequence occupies a full block for just one token.</p>",
    "root_cause": "Static allocation of KV tensors based on max_seq_len causes near 60-80% memory waste; inefficient block mapping in PagedAttention can still leak memory on short requests.",
    "bad_code": "# Traditional static allocation\ncache_k = torch.zeros((batch_size, max_seq_len, num_heads, head_dim))\ncache_v = torch.zeros((batch_size, max_seq_len, num_heads, head_dim))\n# Problem: Most of max_seq_len is zeros but consumes VRAM",
    "solution_desc": "Implement a Virtual Memory-like manager that maps logical token positions to physical blocks. Use a smaller block size (e.g., 8 or 16) to minimize internal fragmentation and allow non-contiguous GPU memory allocation.",
    "good_code": "class PagedKVCacheManager:\n    def __init__(self, block_size, num_blocks):\n        self.block_size = block_size\n        # Physical blocks: (num_blocks, block_size, num_heads, head_dim)\n        self.gpu_cache = self.allocate_physical_blocks(num_blocks)\n        self.block_table = {} # Logical to Physical mapping\n\n    def get_block(self, seq_id, token_index):\n        logical_block_idx = token_index // self.block_size\n        return self.block_table[seq_id][logical_block_idx]",
    "verification": "Compare GPU memory utilization and throughput (requests per minute) against baseline; check for 'Out of Memory' errors during long context inference.",
    "date": "2026-03-25",
    "id": 1774421606,
    "type": "error"
});