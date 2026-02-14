window.onPostDataLoaded({
    "title": "HNSW Recall Drift: Fixing Index Staleness",
    "slug": "hnsw-recall-drift-vector-search",
    "language": "Python",
    "code": "RecallDrift",
    "tags": [
        "Backend",
        "Python",
        "MachineLearning",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) is a leading algorithm for Approximate Nearest Neighbor (ANN) search. However, in high-throughput environments where vectors are frequently updated or deleted, the graph topology degrades—a phenomenon known as 'Recall Drift'. As nodes are removed, the optimized paths through the multi-layered graph become fragmented, leading to lower search accuracy (recall) despite high query latency.</p>",
    "root_cause": "Incremental updates and 'soft deletes' in HNSW graphs lead to suboptimal entry points and broken edges, as the graph is not globally re-optimized after individual mutations.",
    "bad_code": "import hnswlib\n# Repeatedly updating vectors without maintenance\nfor i in range(1000000):\n    index.add_items(new_vector, i)\n    index.mark_deleted(i-100) # Recall drops over time",
    "solution_desc": "Implement a periodic index rebuild strategy or use 'tombstone' cleanup. In systems like Milvus or Pinecone, this involves triggering a compaction or merging segments. Adjusting 'efSearch' dynamically can temporarily mitigate drift at the cost of latency.",
    "good_code": "# Solution: Periodic Re-indexing or tuning efConstruction\nindex.init_index(max_elements=N, ef_construction=200, M=16)\n# If recall < threshold, trigger full rebuild into a shadow index\nif current_recall < 0.90:\n    new_index.add_items(all_vectors)\n    swap_indices(index, new_index)",
    "verification": "Measure recall by comparing HNSW results against a Brute Force (Flat) search baseline using a sample query set.",
    "date": "2026-02-14",
    "id": 1771043299,
    "type": "error"
});