window.onPostDataLoaded({
    "title": "Mitigating HNSW Graph Fragmentation in Vector DBs",
    "slug": "hnsw-graph-fragmentation-fix",
    "language": "Rust",
    "code": "IndexDegradation",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small Worlds) indexes are highly efficient for ANN search but suffer in 'high-churn' environments where vectors are frequently updated or deleted. Most vector databases implement 'logical deletes' by marking nodes as tombstones. Over time, these tombstones break the graph's connectivity, leading to 'island' nodes that are unreachable, significantly dropping search recall and increasing latency as the traverser hits dead ends.</p>",
    "root_cause": "Frequent logical deletions without structural re-linking or index compaction create gaps in the HNSW layers, breaking the small-world navigation properties.",
    "bad_code": "// Logic that only marks nodes as deleted\nfn delete_vector(id: u64) {\n    let node = index.get_node(id);\n    node.set_deleted(true); \n    // Problem: Neighbors still point to this 'dead' node\n}",
    "solution_desc": "Implement a 'repair-on-delete' strategy or periodic background compaction. When a node is deleted, its neighbors should be re-linked to each other, or the index should be periodically rebuilt to prune tombstones and restore graph density.",
    "good_code": "fn delete_and_repair(id: u64) {\n    let neighbors = index.get_neighbors(id);\n    index.mark_deleted(id);\n    // Re-link neighbors to maintain graph connectivity\n    for n in neighbors {\n        index.rebuild_connections_for_node(n);\n    }\n    if index.tombstone_ratio() > 0.2 {\n        index.trigger_compaction();\n    }\n}",
    "verification": "Monitor the 'Recall@K' metric during high-update workloads. If recall stays stable despite deletions, the fragmentation is mitigated.",
    "date": "2026-03-11",
    "id": 1773203298,
    "type": "error"
});