window.onPostDataLoaded({
    "title": "Fix Vector DB HNSW Index Memory Spikes on Ingestion",
    "slug": "fix-vector-db-hnsw-memory-spikes-concurrent-ingestion",
    "language": "Rust",
    "code": "OOM / MemorySpike",
    "tags": [
        "Vector DB",
        "HNSW",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs construct proximity layers across high-dimensional vector spaces. Under high concurrent ingestion, concurrent graph construction threads allocate temporary node candidate lists (efConstruction) and lock neighborhood lists simultaneously. When thousands of vectors are inserted per second, lock contention forces memory fragmentation and uncontrolled heap allocations due to unbuffered thread pool execution and unbounded queueing of node additions.</p><p>This leads to memory spikes exceeding system RAM, triggering kernel OOM killers or crashing vector search instances like Qdrant, Milvus, or custom HNSW implementations.</p>",
    "root_cause": "Unbounded worker queues combined with high efConstruction parameter sizes cause concurrent threads to allocate large local candidate heaps simultaneously without memory pooling or backpressure controls.",
    "bad_code": "// Unbounded parallelism with high ef_construction\npub fn insert_vectors_concurrent(index: &Arc<HNSWIndex>, vectors: Vec<Vector>) {\n    vectors.into_par_iter().for_each(|vec| {\n        // Each worker allocates large search buffers without backpressure\n        index.insert(&vec, 128, 200); // M=128, ef_construction=200\n    });\n}",
    "solution_desc": "Implement dynamic backpressure using bounded semaphore channels, pre-allocate candidate traversal heaps, and enforce strict execution concurrency limits.",
    "good_code": "use tokio::sync::Semaphore;\nuse std::sync::Arc;\n\npub struct BoundedHNSWIngestor {\n    index: Arc<HNSWIndex>,\n    semaphore: Arc<Semaphore>,\n}\n\nimpl BoundedHNSWIngestor {\n    pub async fn insert_batch(&self, vectors: Vec<Vector>) {\n        for vec in vectors {\n            let permit = self.semaphore.clone().acquire_owned().await.unwrap();\n            let index = self.index.clone();\n            tokio::task::spawn_blocking(move || {\n                // Bounded execution prevents concurrent heap allocation spikes\n                index.insert_with_arena(&vec, 64, 100);\n                drop(permit);\n            });\n        }\n    }\n}",
    "verification": "Monitor RSS memory under 10k vector/sec ingestion using jemallocator statistics and ensure RAM usage stays flat under configured bounds without OOM events.",
    "date": "2026-07-22",
    "id": 1784698814,
    "type": "error"
});