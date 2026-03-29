window.onPostDataLoaded({
    "title": "Resolving HNSW Index Stale-Link Accumulation",
    "slug": "hnsw-stale-link-accumulation",
    "language": "C++ / Python",
    "code": "MemoryPerformanceLeak",
    "tags": [
        "Python",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) is the gold standard for vector search, but it is natively optimized for immutable datasets. In dynamic vector databases where deletions and updates are frequent, the index suffers from 'stale-link' accumulation. When a vector is deleted, its node is often just marked as a tombstone.</p><p>Over time, these tombstones break the graph's connectivity. Incoming links to the deleted node remain, but the node no longer facilitates jumps to deeper layers, leading to increased 'search path length' and significant memory overhead without a corresponding increase in data density.</p>",
    "root_cause": "The lack of an eager link-repair mechanism during deletion results in a fragmented graph with suboptimal navigation paths and orphan nodes.",
    "bad_code": "def delete_vector(index, vector_id):\n    # Simple tombstone marking\n    index.mark_deleted(vector_id)\n    # No re-routing of links leads to stale connections",
    "solution_desc": "Implement an 'Eager Repair' strategy during deletion. When a node is removed, the system must identify its neighbors and re-link them to each other (or to the removed node's neighbors) to maintain the small-world property. Alternatively, use a background compaction process to rebuild affected local graph clusters.",
    "good_code": "void delete_with_repair(int node_id) {\n    auto neighbors = get_neighbors(node_id);\n    mark_deleted(node_id);\n    for (auto neighbor : neighbors) {\n        // Find new optimal candidates to replace the deleted node\n        auto candidates = search_layer(neighbor, ...);\n        repair_links(neighbor, candidates);\n    }\n}",
    "verification": "Monitor the 'Recall' and 'Query Latency' metrics over 10,000 delete/insert cycles. A healthy index will maintain stable latency, whereas one with stale links will show linear performance degradation.",
    "date": "2026-03-29",
    "id": 1774760755,
    "type": "error"
});