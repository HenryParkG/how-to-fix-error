window.onPostDataLoaded({
    "title": "Fixing HNSW Index Corruption in Vector Databases",
    "slug": "hnsw-index-corruption-concurrent-upserts",
    "language": "Rust",
    "code": "DataCorruption",
    "tags": [
        "Rust",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) is the gold standard for vector similarity search. However, implementing it in a concurrent environment is fraught with peril. When multiple threads attempt to upsert vectors simultaneously, the graph's structural integrity can be compromised.</p><p>Corruption typically manifests as dangling edges or isolated clusters in the graph, significantly dropping the 'Recall' metric. This happens when two threads update the neighbor list of the same node without proper synchronization, leading to lost updates or invalid memory offsets.</p>",
    "root_cause": "Race conditions during the 'M' nearest neighbor pruning phase. A thread may read a neighbor list, modify it, and write it back, while another thread has already performed an update.",
    "bad_code": "fn add_node(graph: &mut HNSW, vector: Vec<f32>) {\n    let neighbors = graph.search_layer(vector, 0);\n    // UNSAFE: Concurrent access to graph nodes\n    // without fine-grained locking or atomic CAS\n    graph.nodes.push(Node { vector, neighbors });\n    for n in neighbors {\n        graph.nodes[n].neighbors.push(new_id);\n    }\n}",
    "solution_desc": "Implement fine-grained Read-Write locks (RwLock) for every node in the graph. During the neighbor update phase, acquire a write lock on the specific neighbor list being modified. Alternatively, use a lock-free adjacency list with atomic pointer swapping.",
    "good_code": "struct Node {\n    vector: Vec<f32>,\n    neighbors: Arc<RwLock<Vec<usize>>>,\n}\n\nfn safe_add_node(graph: &Graph, vector: Vec<f32>) {\n    let neighbors = graph.search(vector);\n    let new_node = Node { vector, neighbors: Arc::new(RwLock::new(neighbors)) };\n    \n    for &n_idx in neighbors.read().unwrap().iter() {\n        let mut n_list = graph.nodes[n_idx].neighbors.write().unwrap();\n        n_list.push(new_node_id);\n        // Apply heuristic pruning while holding lock\n        prune_neighbors(&mut n_list);\n    }\n}",
    "verification": "Run a multi-threaded insertion test and perform a 'Reachability' check on the graph. Every node should be reachable from the entry point.",
    "date": "2026-04-21",
    "id": 1776748848,
    "type": "error"
});