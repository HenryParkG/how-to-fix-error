window.onPostDataLoaded({
    "title": "Fixing HNSW Index Rebuild Stalls in Vector Databases",
    "slug": "hnsw-index-rebuild-stall-fix",
    "language": "Go",
    "code": "Deadlock/Livelock",
    "tags": [
        "Go",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>During high-ingest loads, Hierarchical Navigable Small World (HNSW) indexes often experience 'rebuild stalls.' This happens because the background compaction process and the foreground insertion threads compete for the same read-write locks on the graph nodes, leading to massive latency spikes or total ingest halts.</p>",
    "root_cause": "The system utilizes a global mutex or coarse-grained locking on the HNSW graph during neighbor link updates, causing lock exhaustion under high concurrency.",
    "bad_code": "func (idx *HNSWIndex) Insert(vector []float32) {\n    idx.mu.Lock() // Global lock causes stalls\n    defer idx.mu.Unlock()\n    node := idx.searchLayer(vector)\n    idx.linkNeighbors(node, vector)\n}",
    "solution_desc": "Implement fine-grained, per-node locking and utilize a 'Copy-on-Write' (CoW) strategy for the HNSW layers. This allows search threads to remain lock-free while only the specific neighborhood being updated is locked.",
    "good_code": "func (idx *HNSWIndex) Insert(vector []float32) {\n    targetNodes := idx.searchLayer(vector)\n    for _, neighbor := range targetNodes {\n        neighbor.mu.Lock() // Granular locking\n        idx.updateLinks(neighbor, vector)\n        neighbor.mu.Unlock()\n    }\n}",
    "verification": "Monitor 'index_thread_wait_duration_seconds' and 'ingest_throughput' metrics during a 100k vector/sec stress test.",
    "date": "2026-04-12",
    "id": 1775971016,
    "type": "error"
});