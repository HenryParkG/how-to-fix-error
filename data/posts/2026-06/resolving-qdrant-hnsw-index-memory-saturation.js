window.onPostDataLoaded({
    "title": "Resolving Qdrant HNSW Index Memory Saturation",
    "slug": "resolving-qdrant-hnsw-index-memory-saturation",
    "language": "Rust / Qdrant",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When ingesting high-dimensional vector data (e.g., 1536-dimensional embeddings) into Qdrant, the default Hierarchical Navigable Small World (HNSW) index construction parameters can cause immediate memory saturation. As concurrent insertion batches increase, Qdrant constructs the link graphs entirely in memory. If parameters such as <code>m</code> (number of edges per node) and <code>ef_construct</code> (number of candidates analyzed) are configured too aggressively, the engine exhausts target physical memory, triggering system Out-Of-Memory (OOM) kernels to kill the process.</p>",
    "root_cause": "High-dimensional graph link matrices and vectors are loaded entirely within volatile RAM, without quantization or storage configurations configured for disk-backed paging operations.",
    "bad_code": "{\n  \"vectors\": {\n    \"size\": 1536,\n    \"distance\": \"Cosine\"\n  },\n  \"hnsw_config\": {\n    \"m\": 64,\n    \"ef_construct\": 256,\n    \"on_disk\": false\n  }\n}",
    "solution_desc": "Enable Product Quantization (PQ) or Scalar Quantization (SQ) to compress high-dimensional vectors by up to 4x. In tandem, force the HNSW configuration to store elements and vectors on-disk (`on_disk: true`), reducing active RAM footprints during massive scaling ingest sequences.",
    "good_code": "{\n  \"vectors\": {\n    \"size\": 1536,\n    \"distance\": \"Cosine\",\n    \"on_disk\": true\n  },\n  \"hnsw_config\": {\n    \"m\": 16,\n    \"ef_construct\": 100,\n    \"on_disk\": true\n  },\n  \"quantization_config\": {\n    \"scalar\": {\n      \"type\": \"int8\",\n      \"quantile\": 0.99,\n      \"always_ram\": false\n    }\n  }\n}",
    "verification": "Monitor Qdrant RAM consumption using standard Prometheus metrics. Verify that memory growth scales linearly (instead of exponentially) with vector counts and does not trigger OOM processes under peak concurrent ingestion.",
    "date": "2026-06-20",
    "id": 1781938532,
    "type": "error"
});