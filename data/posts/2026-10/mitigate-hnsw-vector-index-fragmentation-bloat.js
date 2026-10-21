window.onPostDataLoaded({
    "title": "Mitigate HNSW Vector Index Bloat from Deletes",
    "slug": "mitigate-hnsw-vector-index-fragmentation-bloat",
    "language": "Rust",
    "code": "HNSWFragmentation",
    "tags": [
        "Rust",
        "VectorDB",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs are commonly used for approximate nearest neighbor (ANN) vector search. Under high-churn workloads with continuous record deletions, HNSW implementations typically apply soft-tombstoning to avoid expensive graph reconstruction.</p><p>However, tombstoned nodes remain part of the layered proximity graph. They consume memory, retain adjacency list allocations, and degrade traversal efficiency during beam search. Furthermore, naive edge rewiring creates disconnected components and edge bloat, causing severe memory expansion and degrading recall accuracy over time.</p>",
    "root_cause": "Soft-deleted vectors are retained in adjacency lists to preserve graph reachability without immediate global re-indexing. Over time, edges connecting to tombstoned vectors form dead traversal paths, inflating the memory footprint and causing graph fragmentation.",
    "bad_code": "pub struct HnswIndex {\n    tombstones: std::collections::HashSet<u64>,\n    adjacency_lists: Vec<Vec<u64>>,\n}\n\nimpl HnswIndex {\n    // Naive deletion: merely flags node as tombstoned\n    pub fn soft_delete(&mut self, point_id: u64) {\n        self.tombstones.insert(point_id);\n        // Adjacency lists still point to tombstoned nodes,\n        // causing memory bloat and dead search traversals\n    }\n}",
    "solution_desc": "Implement an active edge repair routine that removes the deleted vertex from all neighbor lists, connects mutual orphaned neighbors using bounded heuristic distance checks, and triggers asynchronous compaction when tombstone density exceeds a predefined threshold.",
    "good_code": "pub struct HnswIndex {\n    tombstones: std::collections::HashSet<u64>,\n    adjacency_lists: Vec<Vec<u64>>,\n    max_connections: usize,\n}\n\nimpl HnswIndex {\n    pub fn prune_and_relink(&mut self, target_id: usize) {\n        let neighbors = self.adjacency_lists[target_id].clone();\n        \n        // Disconnect target from neighbor lists\n        for &neighbor in &neighbors {\n            let list = &mut self.adjacency_lists[neighbor as usize];\n            list.retain(|&id| id != target_id as u64);\n        }\n\n        // Re-establish local connectivity among orphaned neighbors\n        for i in 0..neighbors.len() {\n            for j in (i + 1)..neighbors.len() {\n                let (a, b) = (neighbors[i] as usize, neighbors[j] as usize);\n                if self.adjacency_lists[a].len() < self.max_connections && \n                   !self.adjacency_lists[a].contains(&(b as u64)) {\n                    self.adjacency_lists[a].push(b as u64);\n                    self.adjacency_lists[b].push(a as u64);\n                }\n            }\n        }\n        self.tombstones.remove(&(target_id as u64));\n    }\n}",
    "verification": "Execute 100,000 continuous insertions and deletions against the index. Monitor process RSS memory to ensure it scales strictly with active vector counts rather than cumulative writes, and verify ANN recall@10 remains stable (>98%) throughout the churn cycle.",
    "date": "2026-10-21",
    "id": 1792550055,
    "type": "error"
});