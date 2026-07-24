window.onPostDataLoaded({
    "title": "Fix Qdrant Vector DB HNSW Index Mutation OOM Spikes",
    "slug": "fix-qdrant-hnsw-index-mutation-oom-spikes",
    "language": "Rust",
    "code": "OOMKilled",
    "tags": [
        "Rust",
        "Backend",
        "Docker",
        "Qdrant",
        "Error Fix"
    ],
    "analysis": "<p>During concurrent write operations and payload updates in Qdrant, the HNSW (Hierarchical Navigable Small World) index graph undergoes dynamic re-indexing across segment files. Unbounded graph mutation threads combined with large payload indexing trigger sudden spikes in RSS memory usage, resulting in the host Linux kernel issuing an <code>OOMKilled</code> signal to the container daemon.</p>",
    "root_cause": "Qdrant builds HNSW layers in-memory before persisting them to vector storage segments. When `max_indexing_threads` is unset or over-committed alongside aggressive payload index creation settings, concurrent graph construction jobs allocate intermediate vector link structures faster than Rust's global memory allocator releases them back to the operating system.",
    "bad_code": "# qdrant_config.yaml (Buggy configuration causing memory spikes)\nstorage:\n  performance:\n    max_indexing_threads: 0 # Automatically uses all CPU cores\n\noptimizers:\n  indexing_threshold: 20000\n  memmap_threshold: 50000\n  \nvector_index:\n  hnsw_config:\n    m: 32\n    ef_construct: 250\n    on_disk: false # Keeps all mutations fully in RAM",
    "solution_desc": "Configure dynamic segment build memory limits by constraining `max_indexing_threads`, setting `on_disk: true` for HNSW links, enabling memory-mapped vector segments, and configuring payload schema indexes selectively rather than indexing every metadata field indiscriminately.",
    "good_code": "# qdrant_config.yaml (Optimized memory footprint)\nstorage:\n  performance:\n    max_indexing_threads: 2 # Explicitly bound thread allocations\n\noptimizers:\n  indexing_threshold: 10000\n  memmap_threshold: 10000 # Memory-map segments earlier\n\nvector_index:\n  hnsw_config:\n    m: 16\n    ef_construct: 128\n    on_disk: true # Offload HNSW index graphs to disk via mmap",
    "verification": "Execute `docker stats` or check Grafana container metrics (`container_memory_working_set_bytes`) while running a batch insert workload using Qdrant's `locust` benchmark tool. Ensure memory consumption remains bounded within allocated cgroup RAM limits.",
    "date": "2026-07-24",
    "id": 1784890446,
    "type": "error"
});