window.onPostDataLoaded({
    "title": "Mitigating HNSW Index Poisoning in Vector DBs",
    "slug": "hnsw-index-poisoning-concurrent-upserts",
    "language": "Rust",
    "code": "ConcurrentWriteConflict",
    "tags": [
        "Rust",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) indexes rely on maintaining graph connectivity across multiple layers. During concurrent upserts, multiple threads may attempt to update the neighbor list of the same node simultaneously. Without proper synchronization, this leads to 'index poisoning' where nodes become unreachable or cycles are formed, degrading recall significantly.</p>",
    "root_cause": "Race conditions during the 'Link' phase where neighbor lists are updated without atomic isolation or proper locking.",
    "bad_code": "fn link_nodes(node_a: &Node, node_b: &Node) {\n    // UNSAFE: Direct push to a shared vector without locking\n    node_a.neighbors.push(node_b.id);\n    node_b.neighbors.push(node_a.id);\n}",
    "solution_desc": "Implement a fine-grained locking strategy using a Mutex or RwLock per node. During the candidate selection, use a 'Hand-over-Hand' locking technique or optimistic concurrency control with a retry loop if the neighbor list changed during computation.",
    "good_code": "fn link_nodes(node_a: &Node, node_b: &Node) {\n    let mut neighbors = node_a.neighbor_lock.write().unwrap();\n    if !neighbors.contains(&node_b.id) {\n        neighbors.push(node_b.id);\n        // Prune connections if they exceed 'M'\n        prune_neighbors(&mut neighbors);\n    }\n}",
    "verification": "Perform a 'Recall @ K' benchmark during heavy concurrent write loads. If recall stays stable, the index is structurally sound.",
    "date": "2026-03-09",
    "id": 1773039095,
    "type": "error"
});