window.onPostDataLoaded({
    "title": "Mitigating HNSW Graph Decay in High-Churn Vector DBs",
    "slug": "hnsw-graph-connectivity-decay-fix",
    "language": "Rust / C++",
    "code": "HNSW_DISCONNECTION",
    "tags": [
        "Rust",
        "Python",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) are the gold standard for vector similarity search. However, HNSW graphs suffer from 'connectivity decay' in high-churn environments where deletions are frequent. When nodes (vectors) are deleted, the links that form the 'expressways' of the graph are broken. Without proactive repair, the graph fragments into isolated islands, causing search recall to drop significantly even if the total number of vectors remains constant.</p>",
    "root_cause": "Standard HNSW implementations often use 'tombstoning' for deletions, which ignores the need to re-wire the neighbors of the deleted node to maintain graph expansion properties.",
    "bad_code": "fn delete_vector(node_id: u64) {\n    // Naive deletion: just remove from map\n    // and mark as deleted in the index\n    self.nodes.remove(&node_id);\n    self.tombstones.insert(node_id);\n    // PROBLEM: Neighbors of node_id are now pointing to a void\n}",
    "solution_desc": "Implement a 'repair-on-delete' strategy or periodic background re-indexing. When a node is removed, its neighbors should be re-connected to each other or a new search for nearest neighbors should be performed for each orphaned link to maintain the Navigable Small World property.",
    "good_code": "fn robust_delete(node_id: u64) {\n    let neighbors = self.get_neighbors(node_id);\n    self.remove_node(node_id);\n    for neighbor in neighbors {\n        // Re-evaluate connectivity for orphans\n        let new_links = self.search_knn(neighbor.vector, M);\n        self.update_neighbors(neighbor.id, new_links);\n    }\n}",
    "verification": "Run a 'Recall@K' benchmark before and after a 30% deletion/insertion churn cycle.",
    "date": "2026-05-12",
    "id": 1778551599,
    "type": "error"
});