window.onPostDataLoaded({
    "title": "Fixing HNSW Graph Fragmentation in Vector DBs",
    "slug": "hnsw-graph-fragmentation-vector-db",
    "language": "Rust",
    "code": "Graph Decay",
    "tags": [
        "Rust",
        "Python",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) is a leading algorithm for Approximate Nearest Neighbor (ANN) search. In high-churn environments where vectors are frequently updated or deleted, the graph suffers from 'fragmentation'. Most HNSW implementations use 'logical deletes' (tombstones). Over time, these tombstones break the paths between nodes, significantly increasing the search latency and reducing recall because the graph becomes disconnected and the 'navigable' property is lost.</p>",
    "root_cause": "Accumulation of logical delete markers without graph re-linking, leading to broken edges in the multi-layered HNSW structure.",
    "bad_code": "// Simple tombstone deletion\nfn delete_vector(id: u64) {\n    let node = graph.get_node(id);\n    node.mark_as_deleted(); // Logical delete only\n}",
    "solution_desc": "Implement an active garbage collection or 'defragmentation' strategy. When a node is deleted, its neighbors must be re-connected to preserve graph connectivity, or the graph must be periodically rebuilt using the surviving nodes.",
    "good_code": "// Deletion with neighbor re-linking\nfn delete_and_repair(id: u64) {\n    let neighbors = graph.get_neighbors(id);\n    graph.remove_node(id);\n    for n in neighbors {\n        graph.repair_connectivity(n); // Re-link neighbors to maintain navigation\n    }\n}",
    "verification": "Measure the 'Recall@10' metric before and after a high-volume delete operation. If recall drops below a 5% threshold, trigger a background compaction/rebuild process.",
    "date": "2026-03-18",
    "id": 1773809491,
    "type": "error"
});