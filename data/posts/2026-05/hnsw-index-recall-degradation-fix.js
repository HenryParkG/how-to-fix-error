window.onPostDataLoaded({
    "title": "Resolving HNSW Index Recall Degradation",
    "slug": "hnsw-index-recall-degradation-fix",
    "language": "Python",
    "code": "RecallLoss",
    "tags": [
        "Python",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs are the gold standard for vector search. However, as databases scale to tens of millions of vectors with frequent updates, 'Recall' (the accuracy of nearest neighbor results) often degrades. This happens because the graph topology becomes sub-optimal over time due to node deletions or insufficient connectivity in high-density regions.</p><p>Standard HNSW implementations often suffer from the 'hubbing' effect where a few nodes become over-connected, while newer or updated nodes remain isolated, leading to poor search paths.</p>",
    "root_cause": "Insufficient 'M' (max links per node) and 'ef_construction' parameters relative to the increased dimensionality and dataset size.",
    "bad_code": "# Default parameters often fail at scale\nindex = hnswlib.Index(space='l2', dim=128)\nindex.init_index(max_elements=10000000, ef_construction=200, M=16)\n# Recall drops as more data is streamed in without re-optimization",
    "solution_desc": "Increase the 'M' and 'ef_construction' parameters for denser graph connectivity. Implement a periodic 'compaction' or rebuild strategy to prune suboptimal edges and re-balance the graph entry points.",
    "good_code": "# Higher M for high-dimensional data (e.g., 32-64)\n# Higher ef_construction for better graph quality\nindex.init_index(max_elements=10000000, ef_construction=500, M=48)\n\n# Dynamic ef_search adjustment at query time\nindex.set_ef(200) # Increase search depth during runtime to recover recall",
    "verification": "Compare the recall@10 against a brute-force Flat index. If recall is < 0.95, increment ef_search and M until targets are met.",
    "date": "2026-05-17",
    "id": 1778998422,
    "type": "error"
});