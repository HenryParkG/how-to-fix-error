window.onPostDataLoaded({
    "title": "Fixing Qdrant HNSW Index Memory Bloat & Recall Drop",
    "slug": "fixing-qdrant-hnsw-memory-bloat-recall-drop",
    "language": "Rust",
    "code": "HNSWIndexDegradation",
    "tags": [
        "Rust",
        "VectorDB",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-velocity vector search deployments, Qdrant cluster instances suffer from exponential memory bloat and severe recall drop (under 70%) when vector updates and deletions occur concurrently with heavy HNSW index builds.</p>",
    "root_cause": "Unoptimized HNSW index parameters (m and ef_construct) combined with uncleaned deleted vector payload tombstones lead to fragmented graph layers, bloated graph connectivity, and broken navigation links during graph traversal.",
    "bad_code": "{\n  \"hnsw_config\": {\n    \"m\": 64,\n    \"ef_construct\": 512,\n    \"full_scan_threshold\": 10000,\n    \"max_indexing_threads\": 0\n  }\n}",
    "solution_desc": "Optimize HNSW parameters (m=16, ef_construct=128), enable Scalar Quantization (SQ) to reduce memory footprint by 4x, and configure automated background compaction cleanup triggers for vector tombstones.",
    "good_code": "{\n  \"hnsw_config\": {\n    \"m\": 16,\n    \"ef_construct\": 128,\n    \"on_disk\": true\n  },\n  \"quantization_config\": {\n    \"scalar\": {\n      \"type\": \"int8\",\n      \"quantile\": 0.99,\n      \"always_ram\": true\n    }\n  },\n  \"optimizers_config\": {\n    \"deleted_threshold\": 0.2,\n    \"vacuum_min_vector_number\": 1000\n  }\n}",
    "verification": "Monitor Qdrant telemetry via Prometheus metrics (`qdrant_mem_bytes`, `qdrant_vector_search_latency`). Run recall benchmark scripts using `qdrant-client` to confirm >98% precision@K while cutting RAM usage by 60-75%.",
    "date": "2026-07-26",
    "id": 1785061781,
    "type": "error"
});