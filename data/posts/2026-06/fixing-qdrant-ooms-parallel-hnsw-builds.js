window.onPostDataLoaded({
    "title": "Fixing Qdrant OOMs in Parallel HNSW Builds",
    "slug": "fixing-qdrant-ooms-parallel-hnsw-builds",
    "language": "Rust",
    "code": "Out Of Memory (OOM)",
    "tags": [
        "Qdrant",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When index building is triggered concurrently on deep, high-dimensional vector segments, Qdrant can easily run out of system memory, leading to kernel OOM killing of the service. This memory spike occurs because Hierarchical Navigable Small World (HNSW) graph generation is memory-intensive. For each vector, the algorithm must maintain large dynamic priority queues and active link arrays in RAM.</p><p>By default, Qdrant scales index construction threads to match your CPU cores. On systems with many CPU cores but limited RAM (such as cloud instances with 16+ vCPUs and less than 32GB of RAM), the ratio of indexing threads to available RAM causes concurrent allocations that overwhelm the OS page cache, forcing a violent system OOM termination.</p>",
    "root_cause": "High concurrent allocation of temporary structures during HNSW index builds, driven by unbounded 'max_indexing_threads' configurations paired with in-memory graph construction settings.",
    "bad_code": "# config.yaml (Default / Misconfigured for low-memory, high-CPU environments)\nstorage:\n  performance:\n    # BUG: Setting to 0 spawns workers equivalent to all CPU cores\n    max_indexing_threads: 0\nindex:\n  hnsw:\n    m: 32\n    ef_construct: 200\n    # BUG: Keeps all HNSW graph structures in RAM during build phase\n    on_disk: false",
    "solution_desc": "Mitigate the indexing OOM crashes by explicitly throttling the number of concurrent indexing threads to a fraction of the CPU cores and forcing the intermediate indexing structures onto disk. Memory-mapping (mmap) allows Qdrant to offload active graph construction states to persistent storage, drastically dropping virtual and resident memory footprint.",
    "good_code": "# config.yaml (Optimized memory footprint for stable operations)\nstorage:\n  performance:\n    # FIX: Explicitly restrict parallel indexing workers to prevent peak RAM spikes\n    max_indexing_threads: 2\nindex:\n  hnsw:\n    m: 16\n    ef_construct: 100\n    # FIX: Enable on-disk construction to map memory arrays directly to filesystem pages\n    on_disk: true",
    "verification": "Trigger a full index rebuild by calling Qdrant's update collection API or uploading a large vector payload. Monitor memory consumption of the container using `docker stats` or `top` to verify memory usage stabilizes and remains bounded below safety thresholds without crashing.",
    "date": "2026-06-22",
    "id": 1782118281,
    "type": "error"
});