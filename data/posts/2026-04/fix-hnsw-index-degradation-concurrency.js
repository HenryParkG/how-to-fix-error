window.onPostDataLoaded({
    "title": "Fixing HNSW Index Degradation in Vector Databases",
    "slug": "fix-hnsw-index-degradation-concurrency",
    "language": "Rust, Python",
    "code": "Recall Accuracy Loss",
    "tags": [
        "Rust",
        "Python",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) indexes are the gold standard for vector search. However, during high-concurrency upserts, the graph structure can become 'degraded.' This happens when multiple threads attempt to update the neighbor list of the same node, leading to race conditions where bidirectional links are lost or nodes become isolated 'islands' in the graph.</p>",
    "root_cause": "Lack of atomic updates or fine-grained locking during the 'link' phase of the HNSW algorithm, leading to stale neighbor pointers and broken graph connectivity.",
    "bad_code": "def insert_node(graph, node):\n    neighbors = search_layer(graph, node)\n    # Race condition: Two threads update the same node's neighbors simultaneously\n    graph[node].neighbors = neighbors \n    for n in neighbors:\n        graph[n].neighbors.append(node)",
    "solution_desc": "Implement a Read-Copy-Update (RCU) pattern or use fine-grained mutexes per node level. In high-performance implementations, use an adjacency list protected by atomic pointers to ensure that a neighbor list update is seen as a single atomic transition.",
    "good_code": "impl Node {\n    fn update_neighbors(&self, new_neighbors: Vec<u32>) {\n        let mut neighbors_lock = self.neighbors.write();\n        // Atomic swap of the neighbor list pointer\n        *neighbors_lock = new_neighbors;\n    }\n}",
    "verification": "Run a benchmark comparing 'Recall@10' on a static index versus an index that has undergone 100,000 concurrent upserts.",
    "date": "2026-04-28",
    "id": 1777355451,
    "type": "error"
});