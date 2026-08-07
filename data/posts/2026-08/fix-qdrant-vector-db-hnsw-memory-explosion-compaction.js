window.onPostDataLoaded({
    "title": "Fix Qdrant Vector DB HNSW Memory Explosion in Compaction",
    "slug": "fix-qdrant-vector-db-hnsw-memory-explosion-compaction",
    "language": "Rust",
    "code": "OOMKilled",
    "tags": [
        "Qdrant",
        "VectorDB",
        "HNSW",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>When running large-scale Qdrant vector database deployments under heavy write and payload update loads, segment compaction triggers background HNSW re-indexing. If multiple database segments undergo simultaneous compaction without explicit worker concurrency limits or memory-mapped file bounds, memory spikes exponentially, causing worker processes to be terminated by the OS OOM killer.</p>",
    "root_cause": "Unbounded concurrency in background optimization tasks (max_optimization_threads defaulting too high relative to available system memory) coupled with default in-RAM HNSW index construction that retains both source segment vectors and target in-memory graphs simultaneously during merging.",
    "bad_code": "{\n  \"storage\": {\n    \"performance\": {\n      \"max_optimization_threads\": 0\n    },\n    \"hnsw_config\": {\n      \"in_ram\": true,\n      \"on_disk\": false\n    }\n  }\n}",
    "solution_desc": "Configure segment optimization concurrency according to node RAM capacity, enable on-disk storage for HNSW index structures during construction, and set explicit vector payload memory-mapping rules.",
    "good_code": "{\n  \"storage\": {\n    \"performance\": {\n      \"max_optimization_threads\": 2\n    },\n    \"hnsw_config\": {\n      \"in_ram\": false,\n      \"on_disk\": true,\n      \"m\": 16,\n      \"ef_construct\": 100\n    }\n  }\n}",
    "verification": "Monitor Qdrant node RSS memory consumption via Prometheus metric `qdrant_mem_bytes` while running concurrent payload insertions. Verify that memory remains capped and predictable during segment optimization cycles.",
    "date": "2026-08-07",
    "id": 1786096318,
    "type": "error"
});