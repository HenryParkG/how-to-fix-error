window.onPostDataLoaded({
    "title": "Fixing Qdrant HNSW Index OOM & Merge Failures",
    "slug": "fixing-qdrant-hnsw-index-oom-merge-failures",
    "language": "Rust / Qdrant",
    "code": "OOM / SegmentMergeError",
    "tags": [
        "VectorDB",
        "Rust",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Qdrant utilizes Hierarchical Navigable Small World (HNSW) graphs to achieve fast, high-recall vector searches. Constructing and updating HNSW graphs requires holding large multi-layered graphs in memory. During heavy ingestion phases, Qdrant initiates background segment merges, creating new optimized HNSW indexes. Because building these indexes is memory and CPU-intensive, a high indexing thread count coupled with a large dimension payload can cause RAM usage to spike past system allocations.</p><p>When this happens, the operating system's Out-Of-Memory (OOM) killer abruptly terminates the Qdrant container process, or Qdrant halts the merge process to prevent dynamic crashes, leading to unmerged segments, degraded query performance, and index fragmentation. The issue is especially prominent in containerized Kubernetes or Docker environments with tight memory limits.</p>",
    "root_cause": "The OOM and segment merge failures are caused by allocating too many concurrent indexing threads ('max_indexing_threads') and set values of 'm' or 'ef_construct' that exceed system RAM constraints during parallel segment compilation.",
    "bad_code": "# Aggressive, unconstrained Qdrant configuration triggering OOM under high-concurrency ingestion\nstorage:\n  performance:\n    max_indexing_threads: 0 # Automatically uses all available CPU threads\n\nconnection_timeout_ms: 20000\n\noptimizers:\n  default_segment_number: 2\n\n# High HNSW construction parameters in the database collection creation payload\n# { \n#   \"vectors\": { \"size\": 1536, \"distance\": \"Cosine\" },\n#   \"hnsw_config\": {\n#     \"m\": 64, \n#     \"ef_construct\": 512, \n#     \"on_disk\": false\n#   }\n# }",
    "solution_desc": "To resolve OOMs and merge failures, apply a strict ceiling to indexing threads and enable on-disk vector storage for HNSW index builds. Enabling 'on_disk' for HNSW graphs reduces active RAM usage dramatically by using memory-mapped files (mmap) for vector payloads during construction, swapping speed slightly for immense stability gains.",
    "good_code": "# Optimized Qdrant Production configuration\nstorage:\n  performance:\n    # Restrict concurrent indexing threads explicitly to avoid thread-level memory bloat\n    max_indexing_threads: 2 \n\n# Optimal REST/gRPC configuration when defining the collection's indexing parameters:\n# {\n#   \"vectors\": {\n#     \"size\": 1536,\n#     \"distance\": \"Cosine\",\n#     \"on_disk\": true // Keeps raw vector payloads on disk, mapping them into memory dynamically\n#   },\n#   \"hnsw_config\": {\n#     \"m\": 16,             // Reduced links per node, reducing structural overhead\n#     \"ef_construct\": 128,  // Lower explore depth during build, saving memory & CPU cycles\n#     \"on_disk\": true      // Builds and stores the HNSW structural graph directly on disk\n#   }\n# }",
    "verification": "Deploy Qdrant with the optimized YAML configuration. Monitor memory usage during index generation by querying the Qdrant telemetry endpoint: 'GET /telemetry'. Verify through system monitoring ('docker stats' or Kubernetes metrics) that memory consumption scales linearly with data size instead of spiking exponentially, and ensure the logs show 'Segment merge completed' without interruption.",
    "date": "2026-07-15",
    "id": 1784078783,
    "type": "error"
});