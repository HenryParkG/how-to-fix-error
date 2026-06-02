window.onPostDataLoaded({
    "title": "Fixing HNSW Index Memory Saturation in Vector DBs",
    "slug": "hnsw-index-memory-saturation-vector-db",
    "language": "Rust",
    "code": "OOM Error",
    "tags": [
        "Rust",
        "Vector Database",
        "HNSW",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs are the backbone of high-speed vector search databases. However, because HNSW graphs are highly interconnected multi-layer structures, they perform poorly under continuous, high-frequency updates or deletes. Standard implementations often mark deleted vectors as 'tombstones' to avoid expensive graph reconstruction. Over time, these tombstoned nodes saturate the memory footprint of the database, leading to out-of-memory (OOM) crashes and dramatic search latency degradation as the search path traverses dead connections.</p>",
    "root_cause": "The HNSW update routine fails to actively reclaim memory from tombstoned nodes and does not restructure neighbor connections dynamically, causing dead memory layers to grow without bounds.",
    "bad_code": "use std::collections::{HashMap, HashSet};\n\npub struct HNSWIndex {\n    nodes: HashMap<usize, Vec<f32>>,\n    tombstones: HashSet<usize>,\n}\n\nimpl HNSWIndex {\n    pub fn update_vector(&mut self, id: usize, new_vector: Vec<f32>) {\n        // Naive tombstone approach: retains the outdated node in memory indefinitely\n        self.tombstones.insert(id);\n        let new_id = id + 1000000;\n        self.nodes.insert(new_id, new_vector);\n    } \n}",
    "solution_desc": "Implement an active garbage collection strategy that unlinks tombstoned nodes from all layers of the HNSW graph, repairs neighbor connections, and safely deallocates the vector memory utilizing an Epoch-Based Reclamation (EBR) worker.",
    "good_code": "use std::collections::HashMap;\nuse std::sync::Arc;\n\npub struct Node {\n    pub vector: Vec<f32>,\n    pub neighbors: Vec<usize>,\n}\n\npub struct CleanHNSWIndex {\n    nodes: HashMap<usize, Arc<Node>>,\n}\n\nimpl CleanHNSWIndex {\n    pub fn update_and_relink(&mut self, id: usize, new_vector: Vec<f32>) {\n        // 1. Traverse neighbors and remove links to the obsolete node\n        if let Some(old_node) = self.nodes.get(&id) {\n            let neighbors = old_node.neighbors.clone();\n            for neighbor_id in neighbors {\n                if let Some(neighbor) = self.nodes.get_mut(&neighbor_id) {\n                    // Retain only valid, alive neighbors in memory\n                    let mut node_mut = Arc::make_mut(neighbor);\n                    node_mut.neighbors.retain(|&x| x != id);\n                }\n            }\n        }\n        // 2. Safely evict obsolete memory\n        self.nodes.remove(&id);\n        // 3. Insert newly optimized node\n        self.nodes.insert(id, Arc::new(Node { vector: new_vector, neighbors: vec![] }));\n    }\n}",
    "verification": "Profile memory usage under a sustained workflow of 100,000 updates using Jemalloc heap statistics, confirming that the index memory footprint plateaus instead of rising monotonically.",
    "date": "2026-06-02",
    "id": 1780403766,
    "type": "error"
});