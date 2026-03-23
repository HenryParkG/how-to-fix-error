window.onPostDataLoaded({
    "title": "Fixing HNSW Graph Fragmentation in Vector DBs",
    "slug": "hnsw-graph-fragmentation-vector-db",
    "language": "C++ / Python",
    "code": "Index Decay",
    "tags": [
        "VectorDB",
        "SQL",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs are the gold standard for ANN search. However, during high-throughput incremental indexing\u2014where vectors are frequently updated or deleted\u2014the graph suffers from 'edge fragmentation.' Deleted nodes leave 'ghost' connections, and the greedy routing algorithm begins to stall in local minima, leading to a sharp drop in recall and a spike in search latency.</p>",
    "root_cause": "Standard HNSW implementations often mark nodes as deleted without immediately restructuring the neighbor links of the deleted node's peers, leading to disconnected components or 'dead-end' paths in the graph layers.",
    "bad_code": "# Pseudo-code showing naive incremental deletion\nfor vector_id in deleted_batch:\n    index.mark_deleted(vector_id) \n    # The node remains in the graph structure,\n    # but is ignored during result collection.\n    # Over time, graph connectivity (M edges) collapses.",
    "solution_desc": "Implement a 'Repair-on-Delete' strategy or a background compaction thread. When a node is removed, re-link its neighbors by performing a local neighborhood search to maintain the 'Small World' property. Additionally, adjust the 'efConstruction' parameter dynamically during bursts to ensure new nodes find optimal entry points despite existing fragmentation.",
    "good_code": "def robust_delete(index, vector_id):\n    neighbors = index.get_neighbors(vector_id)\n    index.remove_node(vector_id)\n    # Trigger local re-link\n    for n in neighbors:\n        if index.degree(n) < MIN_M:\n            new_neighbors = index.search_knn(index.get_vector(n), k=M)\n            index.update_neighbors(n, new_neighbors)",
    "verification": "Monitor 'Recall@K' metrics before and after 10,000 incremental updates. The fix is verified if Recall stays within 1% of the initial baseline.",
    "date": "2026-03-23",
    "id": 1774249176,
    "type": "error"
});