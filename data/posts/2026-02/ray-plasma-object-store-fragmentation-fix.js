window.onPostDataLoaded({
    "title": "Ray: Solving Plasma Object Store Fragmentation",
    "slug": "ray-plasma-object-store-fragmentation-fix",
    "language": "Python",
    "code": "Memory Fragmentation",
    "tags": [
        "Python",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Ray utilizes the Plasma Object Store for shared-memory management across distributed workers. In high-throughput task graphs, particularly those involving many small, varying-sized tensors or dataframes, the underlying dlmalloc-based allocator suffers from external fragmentation. Because Plasma objects are immutable and often pinned during execution, the allocator cannot easily move them to consolidate free space. This leads to 'Out of Memory' (OOM) errors even when the system reports significant aggregate free memory, as no single contiguous block is large enough for new allocations.</p>",
    "root_cause": "Plasma's lack of a compaction mechanism combined with pinning of immutable objects leads to holes in shared memory that cannot be filled by new large object allocations.",
    "bad_code": "# High fragmentation pattern\nfor data in large_stream:\n    # Creating thousands of tiny objects in shared memory\n    ray.put(data.small_chunk())\n# Eventually ray.put fails even if RAM is free",
    "solution_desc": "Implement object batching to reduce the number of individual allocations and enable Ray's 'Object Spilling' feature to move cold objects to disk, effectively clearing fragmented blocks.",
    "good_code": "import ray\n# Configuration to handle fragmentation\nray.init(_system_config={\n    \"object_spilling_threshold\": 0.8,\n    \"min_spilling_size\": 100 * 1024 * 1024\n})\n\n# Batch small objects into a single large object\nbatched_data = [d.small_chunk() for d in large_stream]\nray.put(batched_data)",
    "verification": "Monitor the Ray dashboard's memory view. Check 'External Fragmentation' metrics in Plasma. The fix is verified if 'Object Store Full' errors vanish under the same throughput.",
    "date": "2026-02-15",
    "id": 1771137628,
    "type": "error"
});