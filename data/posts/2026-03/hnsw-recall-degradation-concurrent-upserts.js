window.onPostDataLoaded({
    "title": "Resolving HNSW Recall Degradation during Concurrent Upserts",
    "slug": "hnsw-recall-degradation-concurrent-upserts",
    "language": "Go",
    "code": "RecallDegradation",
    "tags": [
        "Backend",
        "Go",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) indices rely on a multi-layered graph structure for fast vector similarity searches. When performing high-concurrency upserts, the integrity of the graph links can degrade if multiple threads attempt to update the neighborhood of the same node simultaneously. This results in 'orphaned' nodes or broken search paths, which directly reduces the recall rate (the accuracy of finding the true nearest neighbors). The degradation is often subtle because the system remains functional but returns lower-quality results.</p>",
    "root_cause": "Race conditions during the 'Link' phase where bidirectional pointers are updated without sufficient isolation, causing inconsistent graph traversal paths.",
    "bad_code": "func (idx *HNSW) Add(vec Vector) {\n    neighbors := idx.searchLayer(vec, idx.EntryNode, 1, layer)\n    for _, n := range neighbors {\n        // UNSAFE: Concurrent access to n.connections without locking\n        n.connections = append(n.connections, vec.ID)\n        idx.nodes[vec.ID].connections = append(idx.nodes[vec.ID].connections, n.ID)\n    }\n}",
    "solution_desc": "Implement fine-grained mutexes or a Read-Copy-Update (RCU) strategy for each node's adjacency list. Use an atomic 'Max-Edge' check during updates to ensure that the heuristic for selecting the best neighbors is maintained even under heavy load.",
    "good_code": "type Node struct {\n    sync.RWMutex\n    connections []uint32\n}\n\nfunc (idx *HNSW) Add(vec Vector) {\n    neighbors := idx.searchLayer(vec, idx.EntryNode, 1, layer)\n    for _, n := range neighbors {\n        n.Lock()\n        // Perform link selection heuristic and update safely\n        n.addConnection(vec.ID, idx.maxM)\n        n.Unlock()\n        \n        idx.nodes[vec.ID].Lock()\n        idx.nodes[vec.ID].addConnection(n.ID, idx.maxM)\n        idx.nodes[vec.ID].Unlock()\n    }\n}",
    "verification": "Compare the recall rate against a ground-truth linear scan before and after the fix while running a load test with high write concurrency.",
    "date": "2026-03-30",
    "id": 1774865314,
    "type": "error"
});