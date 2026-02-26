window.onPostDataLoaded({
    "title": "Solving HNSW Recall Decay in Dynamic Vector DBs",
    "slug": "mitigating-hnsw-recall-degradation-churn",
    "language": "Python",
    "code": "Recall Degradation",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) indices are graph-based structures optimized for static datasets. In high-churn environments where vectors are frequently updated or deleted, the graph becomes fragmented. Deletions typically use 'tombstones' rather than immediate re-linking, which creates 'routing holes' where the search algorithm fails to navigate to the correct neighborhood, leading to a significant drop in retrieval recall over time.</p>",
    "root_cause": "Frequent deletions leave stale nodes in the graph levels. Since HNSW relies on specific 'entry points' and shortcuts, removing these nodes without restructuring the local graph neighbors breaks the 'small world' property.",
    "bad_code": "import faiss\n# Constant churn without index maintenance\nfor batch in data_stream:\n    index.remove_ids(batch.deleted_ids)\n    index.add(batch.new_vectors)\n# Result: Recall drops from 0.99 to 0.70",
    "solution_desc": "Implement a threshold-based compaction strategy or trigger an index rebuild when the 'tombstone' ratio exceeds 20%. Alternatively, use a dynamic HNSW implementation that supports live edge-repair during deletions.",
    "good_code": "def update_index(index, deleted_count, threshold=10000):\n    if deleted_count > threshold:\n        # Reconstruct index to repair graph connectivity\n        params = faiss.extract_index_ivf(index)\n        index = faiss.index_factory(dim, \"HNSW32\")\n        index.add(current_vectors)\n        return index, 0\n    return index, deleted_count",
    "verification": "Compare the recall@K of the live index against a freshly built index using a golden test set every 1,000 updates.",
    "date": "2026-02-26",
    "id": 1772068467,
    "type": "error"
});