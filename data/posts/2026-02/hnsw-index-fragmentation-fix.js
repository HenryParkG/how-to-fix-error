window.onPostDataLoaded({
    "title": "Resolving HNSW Index Fragmentation in Vector DBs",
    "slug": "hnsw-index-fragmentation-fix",
    "language": "SQL",
    "code": "LatencySpike",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indexes are the gold standard for vector similarity search, but they struggle with 'heavy incremental updates'. When vectors are frequently updated or deleted, the graph structure becomes fragmented. 'Tombstoning' deleted nodes leaves gaps in the search path, forcing the engine to traverse longer, sub-optimal routes, which increases P99 latency and degrades recall accuracy over time.</p>",
    "root_cause": "Logical deletions in the HNSW graph lead to disconnected components and high-degree 'ghost' nodes that aren't physically removed until a full rebuild.",
    "bad_code": "-- High frequency incremental updates causing fragmentation\nUPDATE vector_table \nSET embedding = '[0.12, 0.45, ...]' \nWHERE id = 101; -- Repeated thousands of times",
    "solution_desc": "Implement a 'Compaction' strategy or use a DB engine that supports automatic graph re-balancing. Architecturally, move to a 'buffer-and-merge' approach where updates are batched and the index is rebuilt or optimized during low-traffic windows.",
    "good_code": "-- Optimize/Vacuum the index to remove tombstoned nodes\nVACUUM (ANALYZE, VERBOSE) vector_table;\n-- Or trigger index rebuild\nREINDEX INDEX idx_hnsw_embedding;",
    "verification": "Monitor 'Index Efficiency' metrics and perform 'Recall' testing against a ground-truth set before and after the index optimization.",
    "date": "2026-02-18",
    "id": 1771407584,
    "type": "error"
});