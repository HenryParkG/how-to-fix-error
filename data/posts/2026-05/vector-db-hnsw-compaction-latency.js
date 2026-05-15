window.onPostDataLoaded({
    "title": "Fixing HNSW Index Compaction Latency Spikes",
    "slug": "vector-db-hnsw-compaction-latency",
    "language": "Rust",
    "code": "LatencySpike",
    "tags": [
        "Rust",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Vector databases using the HNSW (Hierarchical Navigable Small World) algorithm often suffer from latency spikes during index compaction. Compaction is necessary to merge new vector segments and optimize graph connectivity, but it is extremely resource-intensive.</p><p>When the background compaction process locks the graph structure or saturates the disk I/O and CPU caches, the foreground query threads are forced to wait. This results in the P99 latency doubling or tripling during the compaction window, impacting real-time search performance.</p>",
    "root_cause": "Thread contention and cache invalidation caused by large-scale graph restructuring and segment merging occurring on the same compute resources as search queries.",
    "bad_code": "let index = HNSWIndex::new(params);\n// Default background compaction with no rate limiting\nindex.upsert(vectors);",
    "solution_desc": "Implement a tiered indexing strategy where compaction is rate-limited using a 'Leaky Bucket' algorithm. Additionally, utilize a 'Copy-on-Write' mechanism for graph segments so that searches can continue on the old segment while the new one is being compacted.",
    "good_code": "let config = IndexConfig::builder()\n    .compaction_threads(2)\n    .max_compaction_throughput(MB_100_PER_SEC)\n    .indexing_strategy(Strategy::Async)\n    .build();\nlet index = HNSWIndex::with_config(config);",
    "verification": "Monitor the 'search_latency_seconds' metric specifically during the 'index_compaction_active' event. Use Grafana to verify that the P99 latency remains within 10% of the baseline.",
    "date": "2026-05-15",
    "id": 1778843607,
    "type": "error"
});