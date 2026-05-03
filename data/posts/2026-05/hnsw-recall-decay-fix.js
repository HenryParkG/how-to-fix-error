window.onPostDataLoaded({
    "title": "Mitigating Vector DB Recall Decay in HNSW",
    "slug": "hnsw-recall-decay-fix",
    "language": "Rust",
    "code": "Recall Drift",
    "tags": [
        "Rust",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small Worlds) indexes suffer from recall decay during high-concurrency updates. When nodes are frequently updated or deleted, the graph's connectivity properties break down. This happens because concurrent threads might modify edge lists of the same node without global synchronization, leading to 'orphaned' nodes or broken shortcuts that the search algorithm relies on to traverse layers efficiently.</p>",
    "root_cause": "Race conditions during the 'M' nearest neighbor linking phase and lack of re-balancing after node deletions lead to sub-optimal graph traversals.",
    "bad_code": "// Naive concurrent insertion without global locks or repair\nfn update_index(vector: Vec<f32>) {\n    let neighbors = find_neighbors(vector);\n    for n in neighbors {\n        n.edges.push(new_node_id); // Race condition here\n    }\n}",
    "solution_desc": "Implement a Read-Copy-Update (RCU) pattern for edge lists and trigger a background 'link-repair' task that re-validates the K-nearest neighbor property for modified nodes.",
    "good_code": "fn update_index_safe(vector: Vec<f32>) {\n    let neighbors = find_neighbors(vector);\n    let epoch = global_epoch.load(Ordering::SeqCst);\n    // Atomic edge update with heuristic re-evaluation\n    neighbors.iter().for_each(|n| {\n        n.atomic_edge_swap(new_node_id, epoch);\n        schedule_maintenance(n.id);\n    });\n}",
    "verification": "Measure Recall@K before and after 10,000 concurrent updates; the delta should be < 0.5%.",
    "date": "2026-05-03",
    "id": 1777802345,
    "type": "error"
});