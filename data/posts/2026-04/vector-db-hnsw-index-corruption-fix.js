window.onPostDataLoaded({
    "title": "Mitigating Vector DB HNSW Index Corruption",
    "slug": "vector-db-hnsw-index-corruption-fix",
    "language": "Rust",
    "code": "ConcurrentCorruption",
    "tags": [
        "VectorDB",
        "HNSW",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indices are highly efficient for approximate nearest neighbor search but are notoriously difficult to scale for concurrent upserts. Index corruption occurs when multiple threads attempt to rewire the same proximity graph nodes simultaneously. Without fine-grained locking, pointers in the multi-layer graph can point to deallocated memory or create circular references, causing the search algorithm to enter infinite loops or crash.</p>",
    "root_cause": "Non-atomic updates to neighbor lists during the 'link' phase of the HNSW insertion algorithm when high-dimensional vectors are added in parallel.",
    "bad_code": "fn add_link(node: &mut Node, neighbor_id: u32) {\n    // Thread-unsafe modification of neighbor vector\n    node.neighbors.push(neighbor_id);\n}",
    "solution_desc": "Implement a Read-Copy-Update (RCU) pattern or use Mutex-protected adjacency lists per node. In high-performance Rust implementations, use AtomicPtr for neighbor list heads to ensure lock-free but safe pointer swapping.",
    "good_code": "use std::sync::Arc;\nuse dashmap::DashMap;\n\nstruct HNSW {\n    // Use concurrent hashmap for node access\n    nodes: DashMap<u32, Arc<RwLock<Node>>>,\n}\n\nfn safe_link(node: &Arc<RwLock<Node>>, neighbor_id: u32) {\n    let mut n = node.write().unwrap();\n    n.neighbors.push(neighbor_id);\n}",
    "verification": "Run a stress test with 100+ concurrent threads performing upserts, then perform a full graph traversal (BFS) to ensure all nodes are reachable and no cycles exist.",
    "date": "2026-04-09",
    "id": 1775697530,
    "type": "error"
});