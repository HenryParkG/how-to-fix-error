window.onPostDataLoaded({
    "title": "Fixing Vector DB HNSW Compaction OOM under Load",
    "slug": "fixing-vector-db-hnsw-compaction-oom",
    "language": "Rust",
    "code": "OOMKilled / Heap Exhaustion",
    "tags": [
        "Rust",
        "Vector Search",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>When executing high-concurrency vector upserts into an HNSW (Hierarchical Navigable Small World) index, memory exhaustion (OOM) commonly occurs during index compaction phases. In high-throughput settings, the active graph resides in-memory to maintain ultra-low latency searches and updates. However, during rapid updates, the database must write new segments and merge old ones to reclaim stale vector nodes and re-balance the graph connections.</p><p>As the background compactor merges multiple small segments into a larger HNSW layer, it reads source adjacency lists and node vectors into memory simultaneously. Because the merging threads operate concurrently with incoming upsert threads, the peak memory usage spikes quadratically with respect to the graph's link parameter ($M$) and construction parameter ($efConstruction$), quickly exceeding container memory limits and triggering the Linux Kernel Out-Of-Memory (OOM) killer.</p>",
    "root_cause": "Unthrottled memory allocation during background index compaction where multiple high-degree HNSW segments are merged concurrently in memory without backpressure controls or on-disk serialization buffers.",
    "bad_code": "use std::sync::Arc;\nuse tokio::task;\n\n// BUGGY: Initiates compaction for every segment merge without concurrency limits\n// or memory-budget awareness, resulting in immediate heap exhaustion under high-throughput upserts.\npub async fn trigger_unbounded_compaction(segments: Vec<Arc<HNSWIndex>>) {\n    for segment in segments {\n        task::spawn(async move {\n            // Triggers memory-intensive graph building in parallel with no throttling\n            let compact_result = segment.compact_and_merge_layers().await;\n            println!(\"Compacted segment: {:?}\", compact_result);\n        });\n    }\n}",
    "solution_desc": "Implement a memory-bounded compaction scheduler using a semaphore to limit concurrent merge tasks. Introduce a memory-mapped (mmap) temporary storage buffer or chunked serialization strategy during index reconstruction, preventing raw HNSW nodes from accumulating on the active heap.",
    "good_code": "use std::sync::Arc;\nuse tokio::sync::Semaphore;\nuse tokio::task;\n\n// FIXED: Enforces strict concurrency limits and a memory-aware budget\n// for background HNSW index compaction using a Semaphore control.\npub async fn trigger_bounded_compaction(segments: Vec<Arc<HNSWIndex>>, max_concurrent_merges: usize) {\n    let semaphore = Arc::new(Semaphore::new(max_concurrent_merges));\n\n    for segment in segments {\n        let permit = semaphore.clone().acquire_owned().await.unwrap();\n        task::spawn(async move {\n            // Explicitly throttle using the permit guard\n            let _guard = permit;\n            \n            // Execute compaction with disk-backed buffers or memory budget allocation\n            if let Err(e) = segment.compact_and_merge_layers_mmap().await {\n                eprintln!(\"Compaction failed safely: {:?}\", e);\n            }\n        });\n    }\n}",
    "verification": "Deploy the fixed database configuration to a test cluster. Execute a high-density vector upsert load test simulating 50,000 upserts/sec using Go/Rust benchmark clients. Monitor the system resident set size (RSS) memory footprint using prometheus-node-exporter. Verify that memory spikes do not exceed the bounded container allocations and the OOM killer is never invoked.",
    "date": "2026-06-10",
    "id": 1781058923,
    "type": "error"
});