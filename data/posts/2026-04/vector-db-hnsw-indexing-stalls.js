window.onPostDataLoaded({
    "title": "Fixing Vector DB HNSW Indexing Stalls",
    "slug": "vector-db-hnsw-indexing-stalls",
    "language": "Go",
    "code": "HNSWLockContention",
    "tags": [
        "Go",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indexes are the gold standard for vector similarity search, but they suffer from significant performance degradation during high-concurrency 'upserts'. As dimensions increase, the cost of computing distances to find the 'nearest neighbors' at each layer of the graph grows.</p><p>Stalls typically manifest as a sharp drop in throughput and a spike in CPU wait times. This is often due to lock contention on the entry point nodes of the graph or excessive memory allocation during the construction of the 'efConstruction' list when many threads attempt to update the same neighborhood of the graph simultaneously.</p>",
    "root_cause": "Global mutex contention during the 'M' link update phase of the HNSW algorithm and CPU cache misses during high-dimensional distance calculations.",
    "bad_code": "func (idx *HNSWIndex) Upsert(vec []float32) {\n    idx.Lock() // Global lock causes massive stalls during high-dim upserts\n    defer idx.Unlock()\n    idx.insert(vec, idx.config.M, idx.config.EfConstruction)\n}",
    "solution_desc": "Implement fine-grained locking on a per-node level and utilize SIMD-accelerated distance metrics (AVX-512/NEON). Additionally, use an asynchronous insertion queue to batch updates and decouple the API response from the index stabilization.",
    "good_code": "// Use fine-grained locking and SIMD\nfunc (idx *HNSWIndex) ConcurrentUpsert(vec []float32) {\n    node := idx.findEntryPoint()\n    node.Mu.Lock() // Only lock the specific neighborhood being modified\n    idx.linkNode(node, vec)\n    node.Mu.Unlock()\n    // Use specialized SIMD assembly for Cosine/Euclidean distance\n}",
    "verification": "Measure 'indexing_latency_ms' and 'cpu_utilization_simd'. Throughput should remain linear as concurrency increases until saturation.",
    "date": "2026-04-24",
    "id": 1777025877,
    "type": "error"
});