window.onPostDataLoaded({
    "title": "Mitigating HNSW Graph Fragmentation in Vector DBs",
    "slug": "hnsw-vector-db-fragmentation",
    "language": "Rust",
    "code": "GraphFragmentation",
    "tags": [
        "Rust",
        "SQL",
        "Performance",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) graphs are prone to 'fragmentation' during concurrent upserts. When a vector is updated or deleted, the edges connecting it across different layers of the graph become stale. If these edges are not cleaned up or re-balanced synchronously, the graph loses its 'small world' property, leading to high search latency and a significant drop in recall as the search path becomes disconnected.</p>",
    "root_cause": "Concurrent deletions leave orphaned entry points and broken bidirectional links that aren't properly re-linked by standard insertion logic.",
    "bad_code": "fn upsert_vector(graph: &mut HNSW, id: u64, vec: Vec<f32>) {\n    graph.delete(id); // Simple deletion leaves holes\n    graph.insert(id, vec); // Insertion doesn't necessarily heal old paths\n}",
    "solution_desc": "Implement a 'Mark-and-Sweep' or 'Tombstone' strategy combined with background compaction. Instead of immediate removal, mark nodes as deleted and use a background thread to re-link neighbors of deleted nodes to maintain graph connectivity.",
    "good_code": "fn safe_upsert(graph: &Arc<RwLock<HNSW>>, id: u64, vec: Vec<f32>) {\n    let mut g = graph.write();\n    g.mark_tombstone(id);\n    g.insert_with_repair(id, vec); // Logic to connect neighbors of old id to new nodes\n    if g.tombstone_count() > THRESHOLD {\n        g.schedule_compaction(); // Background re-indexing\n    }\n}",
    "verification": "Run a recall benchmark (e.g., ANN-Benchmarks) before and after a high-volume upsert load to ensure recall stays >95%.",
    "date": "2026-03-12",
    "id": 1773308084,
    "type": "error"
});