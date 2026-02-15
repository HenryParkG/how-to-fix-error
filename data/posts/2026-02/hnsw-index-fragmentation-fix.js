window.onPostDataLoaded({
    "title": "Solving HNSW Index Fragmentation in Vector DBs",
    "slug": "hnsw-index-fragmentation-fix",
    "language": "Rust / Python",
    "code": "HNSW_RECALL_DROP",
    "tags": [
        "Rust",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) indices are sensitive to high-churn environments where 'upserts' (update + insert) are frequent. Standard HNSW implementations handle deletions by marking nodes as 'deleted' (tombstoning). Over time, these tombstones fragment the graph, forcing the search algorithm to traverse dead links, which increases latency and significantly degrades recall accuracy as the 'entry points' to lower layers become sparse.</p>",
    "root_cause": "Accumulated 'tombstoned' nodes in the HNSW graph layers leading to disconnected components or inefficient search paths that fail to reach the true nearest neighbors.",
    "bad_code": "for record in stream:\n    # High churn: constant updates to the same IDs\n    vector_db.upsert(id=record.id, vector=record.embedding)\n    # No maintenance logic for index health",
    "solution_desc": "Implement a background compaction strategy that periodically triggers a 'shrink' or 'rebuild' phase. Newer engines use 'In-place Link Repair' to reconnect neighbors of deleted nodes during idle cycles or utilize a dynamic HNSW variant that replaces deleted nodes with fresh inserts immediately.",
    "good_code": "def maintenance_loop(index):\n    if index.tombstone_ratio() > 0.2:\n        # Trigger background rebuilding of the graph\n        index.recompact(target_utilization=0.9)\n        # Or use a provider that supports dynamic link repair\n        index.optimize(parallel=True)",
    "verification": "Monitor the 'Recall@10' metric against a ground truth set; if it drops below 0.95 during heavy updates, compaction is required.",
    "date": "2026-02-15",
    "id": 1771147410,
    "type": "error"
});