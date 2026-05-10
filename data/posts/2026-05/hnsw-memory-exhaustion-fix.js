window.onPostDataLoaded({
    "title": "Fixing HNSW Memory Exhaustion in Vector Databases",
    "slug": "hnsw-memory-exhaustion-fix",
    "language": "Rust",
    "code": "OOM_ERROR",
    "tags": [
        "Rust",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) index construction is notoriously memory-intensive. During the construction of high-dimensional vectors (e.g., 1536-dim), the database must keep the graph adjacency list in RAM. If the 'M' (max connections per element) and 'ef_construction' parameters are set too high relative to available memory, the process will trigger the OOM killer, as memory usage scales O(N * M) where N is the number of vectors.</p>",
    "root_cause": "Excessive allocation of the adjacency graph in-memory combined with high-dimensional vector buffers during the 'efConstruction' search phase.",
    "bad_code": "let config = HnswConfig {\n    m: 64, // Too high for 32GB RAM at 10M vectors\n    ef_construction: 512,\n    storage_type: StorageType::InMemory,\n};",
    "solution_desc": "Switch to a Memory-Mapped (MMap) storage backend for the index or implement Product Quantization (PQ) to compress vector representations before indexing, significantly reducing the memory footprint per node.",
    "good_code": "let config = HnswConfig {\n    m: 16,\n    ef_construction: 128,\n    storage_type: StorageType::Mmap, // Offload to disk-backed memory\n};\n// Enable Product Quantization to reduce vector size by 4x-8x\nindex.enable_pq(CompressionRatio::X8);",
    "verification": "Monitor the resident set size (RSS) during indexing using 'htop' or 'Prometheus' metrics to ensure memory usage plateaus at safe levels.",
    "date": "2026-05-10",
    "id": 1778392546,
    "type": "error"
});