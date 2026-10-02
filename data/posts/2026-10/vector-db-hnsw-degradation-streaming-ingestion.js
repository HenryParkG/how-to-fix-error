window.onPostDataLoaded({
    "title": "Vector DB: HNSW Lock Contention During Streaming Ingestion",
    "slug": "vector-db-hnsw-degradation-streaming-ingestion",
    "language": "Rust",
    "code": "HNSWIndexLockContention",
    "tags": [
        "Rust",
        "Backend",
        "Python",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs deliver sub-millisecond approximate nearest neighbor (ANN) search latency, but their multi-layer pointer graphs are inherently complex to update concurrently. Under real-time streaming ingestion, worker threads must execute multi-hop greedy traversals, evaluate distance metrics, lock candidate nodes, and update reciprocal bidirectional edges (up to parameter <code>M</code>).</p><p>When write throughput reaches thousands of vectors per second, fine-grained node locks (e.g., <code>parking_lot::RwLock</code> per vertex) trigger widespread lock convoys. Neighbor lists become contention hotspots. Consequently, query P99 latency spikes by orders of magnitude, ingestion throughput collapses, and inconsistent partial linkings degrade recall accuracy.</p>",
    "root_cause": "Synchronously locking graph nodes and updating bidirectional adjacency lists across multiple HNSW layers directly during write requests, causing reader-writer starvation and lock convoys on hub nodes.",
    "bad_code": "// Naive concurrent HNSW node insertion in Rust\npub fn insert_vector(&self, point: &[f32], id: usize) {\n    let neighbors = self.search_layer_candidates(point, self.ef_construction);\n    for neighbor in neighbors {\n        let mut node = self.nodes[neighbor].write(); // Coarse-grained exclusive lock\n        node.add_edge(id); // Blocks concurrent readers and search traversals\n        self.nodes[id].write().add_edge(neighbor);\n    }\n}",
    "solution_desc": "Decouple ingestion using an LSM-tree-inspired vector architecture: stream raw vectors into an append-only, lock-free memory buffer (or flat index with SIMD-accelerated brute-force search) to acknowledge writes immediately. Concurrently, a background worker consumes batches, constructs static HNSW segments using immutable bulk-insertion algorithms, and periodically merges them using epoch-based synchronization.",
    "good_code": "use crossbeam_epoch as epoch;\nuse crossbeam_queue::SegQueue;\nuse std::sync::Arc;\n\npub struct ConcurrentVectorIngestor {\n    staging_queue: Arc<SegQueue<(usize, Vec<f32>)>>,\n    active_hnsw_segment: arc_swap::ArcSwap<HnswSegment>,\n}\n\nimpl ConcurrentVectorIngestor {\n    // Lock-free instant write path\n    pub fn enqueue_vector(&self, id: usize, vector: Vec<f32>) {\n        self.staging_queue.push((id, vector));\n    }\n\n    // Background batch compaction\n    pub fn flush_batch_to_hnsw(&self) {\n        let guard = epoch::pin();\n        let mut batch = Vec::new();\n        while let Some(item) = self.staging_queue.pop() {\n            batch.push(item);\n        }\n        if !batch.is_empty() {\n            let current_index = self.active_hnsw_segment.load();\n            let new_index = current_index.bulk_build_parallel(batch);\n            self.active_hnsw_segment.store(Arc::new(new_index));\n        }\n    }\n}",
    "verification": "Execute high-concurrency ingestion tests with 100 concurrent workers pushing 5,000 vectors/sec. Verify with Prometheus that read search QPS stays consistent (>2,000 QPS at P99 < 15ms) without lock acquisition timeouts.",
    "date": "2026-10-02",
    "id": 1790910695,
    "type": "error"
});