window.onPostDataLoaded({
    "title": "Resolving HNSW Index Fragmentation and Recall Decay",
    "slug": "hnsw-index-fragmentation-recall-decay",
    "language": "Rust",
    "code": "RecallDecay",
    "tags": [
        "Rust",
        "VectorDB",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indexes are the gold standard for vector search. however, they are notoriously sensitive to high-frequency updates and deletions. In many Vector DB implementations, 'deleting' a vector merely marks it as a tombstone.</p><p>Over time, these tombstones fragment the graph, breaking the 'navigable' property and causing search algorithms to get stuck in local minima, which significantly degrades recall accuracy.</p>",
    "root_cause": "Graph connectivity degradation due to uncleared tombstones and lack of dynamic re-linking during high-velocity mutations.",
    "bad_code": "for doc in data_stream:\n    index.delete(doc.id)\n    index.insert(doc.vector) # Fragmentation builds up",
    "solution_desc": "Implement a proactive index maintenance strategy. This involves monitoring the 'deleted' ratio and triggering a background compaction or a partial rebuild using optimized M and ef_construction parameters to restore graph integrity.",
    "good_code": "if index.tombstone_ratio() > 0.2:\n    index.compact_and_relink() \n    # Or rebuild index with higher ef_construction\n    index.optimize(target_recall=0.99)",
    "verification": "Run a recall benchmark against a 'ground truth' set. If recall drops below the defined threshold (e.g., 95%), trigger the optimization routine.",
    "date": "2026-03-03",
    "id": 1772512933,
    "type": "error"
});