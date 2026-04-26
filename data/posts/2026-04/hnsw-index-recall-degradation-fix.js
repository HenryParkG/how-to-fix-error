window.onPostDataLoaded({
    "title": "Fixing HNSW Recall Loss in High-Throughput Upserts",
    "slug": "hnsw-index-recall-degradation-fix",
    "language": "Python",
    "code": "Recall Degradation",
    "tags": [
        "Python",
        "Backend",
        "VectorDB",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) indices are sensitive to 'update churn.' When records are frequently updated (upserted), the underlying graph structure accumulates 'dead nodes' or suboptimal entry points. Over time, the search pathing becomes fragmented, causing the recall rate to drop significantly compared to a fresh index built with the same data.</p>",
    "root_cause": "Most HNSW implementations handle updates as a logical Delete-then-Insert. High-throughput workloads leave orphaned connections in the graph layers because the 're-linking' process during deletion is often less exhaustive than the initial construction to maintain performance.",
    "bad_code": "# Standard continuous upsert loop without maintenance\nfor batch in data_stream:\n    index.upsert(ids=batch.ids, vectors=batch.vectors)\n    # Recall drops from 0.99 to 0.85 after 100k iterations",
    "solution_desc": "Implement a periodic 'Index Rebuild' or 'Compact' trigger based on the fragmentation ratio. Additionally, tune the M (max connections) and ef_construction parameters higher to provide more redundancy in the graph edges during updates.",
    "good_code": "def upsert_with_maintenance(index, batch, threshold=0.2):\n    index.upsert(batch.ids, batch.vectors)\n    if index.fragmentation_ratio() > threshold:\n        # Trigger background rebuild to restore graph integrity\n        index.rebuild(parallel_factor=4)\n        index.vacuum_deleted_nodes()",
    "verification": "Compare Search Recall@K (e.g., K=10) between a long-running instance and a freshly indexed baseline of the same dataset.",
    "date": "2026-04-26",
    "id": 1777187943,
    "type": "error"
});