window.onPostDataLoaded({
    "title": "Fixing HNSW Index Stale-Links in Vector Databases",
    "slug": "hnsw-index-stale-links-fix",
    "language": "Rust",
    "code": "StaleLinkError",
    "tags": [
        "Rust",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) graphs are sensitive to high-frequency updates and deletions. In high-throughput vector databases, a 'stale link' occurs when a node is deleted but its neighbors still point to its memory address, causing the search algorithm to crash or return incorrect results (Recall degradation).</p>",
    "root_cause": "Race conditions between the vacuuming thread (garbage collection) and the concurrent insertion thread updating the adjacency list.",
    "bad_code": "// Direct mutation without epoch protection\nfn update_neighbors(node_id: usize, new_links: Vec<usize>) {\n    let node = self.nodes.get_mut(node_id);\n    node.neighbors = new_links; // Links might point to deleted IDs\n}",
    "solution_desc": "Implement an Epoch-based Reclamation (EBR) system or a Read-Copy-Update (RCU) pattern for neighbor lists. Ensure that links are only updated after the deletion has been globally synchronized and use atomic pointers for graph edges.",
    "good_code": "// Using atomic pointers and epoch-based cleanup\nfn safe_update_links(node: &Node, neighbors: Arc<Vec<AtomicUsize>>) {\n    let old_links = node.links.swap(neighbors, Ordering::AcqRel);\n    epoch::defer_destroy(old_links);\n}",
    "verification": "Run a multi-threaded 'upsert-delete' benchmark and monitor the 'Recall@10' metric to ensure it doesn't drop over time.",
    "date": "2026-02-27",
    "id": 1772174522,
    "type": "error"
});