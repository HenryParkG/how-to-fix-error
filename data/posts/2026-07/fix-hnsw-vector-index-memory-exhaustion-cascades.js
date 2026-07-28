window.onPostDataLoaded({
    "title": "Fix HNSW Vector Index Memory Exhaustion Cascades",
    "slug": "fix-hnsw-vector-index-memory-exhaustion-cascades",
    "language": "Rust",
    "code": "OOMKilled",
    "tags": [
        "Rust",
        "Backend",
        "VectorDB",
        "HNSW",
        "Error Fix"
    ],
    "analysis": "<p>High-dimensional vector indexing using Hierarchical Navigable Small World (HNSW) graphs demands significant memory for maintaining multi-layer graph structures, node neighbor links, and raw vector data. During high-throughput ingestion, unbounded dynamic graph insertion causes exponential heap allocation spikes and extreme memory fragmentation.</p><p>When containerized instances exceed cgroup memory limits due to simultaneous batch writes and dynamic graph construction (`ef_construction`), Linux kernel OOM killers terminate the process, triggering immediate service degradation and cascading cluster failures.</p>",
    "root_cause": "Unbounded concurrent ingestion threads dynamically expand graph link allocations faster than heap compaction can run. High `ef_construction` parameter values exponentially scale neighbor search memory overhead per thread during multi-layer index traversal.",
    "bad_code": "use rayon::prelude::*;\n\npub fn batch_insert_unbounded(index: &mut HnswIndex, vectors: Vec<Vec<f32>>) {\n    // Parallel insertion with no channel backpressure or memory bounds\n    vectors.into_par_iter().for_each(|vec| {\n        // High ef_construction causes massive transient heap allocation per worker thread\n        index.insert_with_params(&vec, 200 /* ef_construction */, 64 /* M */);\n    });\n}",
    "solution_desc": "Apply backpressure with bounded async channels, limit parallel insertion concurrency via semaphores, and quantize high-dimensional vectors (e.g., Scalar Quantization SQ8) before inserting them into the graph.",
    "good_code": "use std::sync::Arc;\nuse tokio::sync::{mpsc, Semaphore};\n\npub async fn bounded_batch_insert(\n    index: Arc<HnswIndex>,\n    mut rx: mpsc::Receiver<Vec<f32>>,\n    max_concurrency: usize,\n) {\n    let semaphore = Arc::new(Semaphore::new(max_concurrency));\n\n    while let Some(vec) = rx.recv().await {\n        let permit = semaphore.clone().acquire_owned().await.unwrap();\n        let index_ref = index.clone();\n        \n        tokio::task::spawn_blocking(move || {\n            // Quantize vector to reduce node payload size by ~75%\n            let sq8_vec = quantize_sq8(&vec);\n            index_ref.insert_quantized(&sq8_vec, 64 /* ef_construction */, 32 /* M */);\n            drop(permit);\n        });\n    }\n}",
    "verification": "Deploy Prometheus node metrics tracking container RSS (`container_memory_rss`). Run high-throughput 1536-dimension ingestion stress tests and verify memory consumption stabilizes within defined buffer limits without triggering host OOM events.",
    "date": "2026-07-28",
    "id": 1785226489,
    "type": "error"
});