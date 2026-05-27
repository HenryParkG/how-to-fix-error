window.onPostDataLoaded({
    "title": "Fixing Qdrant HNSW Recall Degradation and Memory Bloat",
    "slug": "fixing-qdrant-hnsw-recall-degradation-memory-bloat",
    "language": "Rust / Python",
    "code": "Qdrant HNSW Degradation",
    "tags": [
        "Rust",
        "Python",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When using Qdrant for real-time applications involving high-churn vector ingestion (constant upserts, updates, and deletes), users often observe a dual failure mode: search recall accuracy slowly drops (e.g., from 98% down to 85%), while the container's RSS memory usage swells unbounded. This phenomenon degrades nearest-neighbor quality and triggers out-of-memory (OOM) kills at the system level.</p><p>In HNSW (Hierarchical Navigable Small World) graphs, deletions do not instantly restructure the multi-layered graph. Instead, they mark vectors as tombstoned. Over time, high update churn creates dead routing paths and isolated islands in the graph, making it impossible for the search heuristic to find actual nearest neighbors. Simultaneously, virtual memory fragmentation in standard allocators combined with un-compacted vector payloads causes significant RSS memory bloat.</p>",
    "root_cause": "Frequent mutations leave un-compacted tombstones in the HNSW index, degrading graph routing paths. Memory bloat occurs because physical memory is not reclaimed by the underlying allocator (like jemalloc or glibc) due to continuous vector allocation-deallocation fragmentation.",
    "bad_code": "{\n  \"name\": \"vector_collection\",\n  \"vectors\": {\n    \"size\": 1536,\n    \"distance\": \"Cosine\"\n  },\n  \"hnsw_config\": {\n    \"m\": 16,\n    \"ef_construct\": 100\n  },\n  \"optimizers_config\": {\n    \"deleted_threshold\": 0.2,\n    \"vacuum_min_vector_number\": 1000\n  }\n}",
    "solution_desc": "Modify the Qdrant configuration to execute segment compaction and vacuuming more aggressively. Enable scalar/product quantization to drastically decrease the memory footprint of active vectors, and configure dynamic segment optimization thresholds to continuously rebuild degrading HNSW links.",
    "good_code": "{\n  \"name\": \"vector_collection\",\n  \"vectors\": {\n    \"size\": 1536,\n    \"distance\": \"Cosine\",\n    \"quantization_config\": {\n      \"scalar\": {\n        \"type\": \"int8\",\n        \"always_ram\": true\n      }\n    }\n  },\n  \"hnsw_config\": {\n    \"m\": 32,\n    \"ef_construct\": 200,\n    \"on_disk\": true\n  },\n  \"optimizers_config\": {\n    \"deleted_threshold\": 0.05,\n    \"vacuum_min_vector_number\": 100,\n    \"max_segment_size_kb\": 1048576,\n    \"memmap_threshold_kb\": 32768\n  }\n}",
    "verification": "Monitor Qdrant metric endpoints `/telemetry` to trace memory consumption. Run parallel accuracy tests comparing Qdrant search results against an exact brute-force flat index to verify recall returns to target limits (>98%) post-optimization.",
    "date": "2026-05-27",
    "id": 1779883930,
    "type": "error"
});