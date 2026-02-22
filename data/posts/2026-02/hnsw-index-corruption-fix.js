window.onPostDataLoaded({
    "title": "Resolving HNSW Index Corruption in Vector Databases",
    "slug": "hnsw-index-corruption-fix",
    "language": "Go",
    "code": "Data Corruption",
    "tags": [
        "Go",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs are the gold standard for vector similarity searches. However, during high-concurrency upserts, the graph structure is prone to corruption. This typically manifests as 'orphaned nodes' or broken bidirectional links between layers.</p><p>The complexity of HNSW lies in its multi-layered linked-list-like structure. When multiple threads attempt to rebalance the 'M' (max neighbors) of a node simultaneously, or when a node is deleted while being used as an entry point for another search, the pointers in the adjacency list can point to invalid memory or create infinite loops in the graph traversal.</p>",
    "root_cause": "Insufficient locking granularity during the 'SelectNeighbors' and 'Link' phases of HNSW upserts, causing race conditions in the graph's adjacency list.",
    "bad_code": "func (idx *HNSW) Insert(vector []float32) {\n    neighbors := idx.searchLayer(vector, idx.entryPoint, idx.L)\n    // CRITICAL BUG: No lock while modifying neighbor connections\n    for _, n := range neighbors {\n        n.connections = append(n.connections, newNode)\n        if len(n.connections) > idx.M {\n            n.shrinkConnections()\n        }\n    }\n}",
    "solution_desc": "Implement fine-grained Mutex locking on a per-node basis or use a Read-Write Lock (RWLock) during the neighbor rebalancing phase. Ensure that node deletions use a 'tombstone' strategy rather than immediate removal to maintain graph integrity during active searches.",
    "good_code": "type Node struct {\n    sync.RWMutex\n    connections []uint32\n    vector      []float32\n}\n\nfunc (idx *HNSW) Insert(newNodeID uint32, vector []float32) {\n    targetNodes := idx.searchLayer(vector)\n    for _, targetID := range targetNodes {\n        targetNode := idx.nodes[targetID]\n        targetNode.Lock() // Acquire per-node lock\n        targetNode.connections = append(targetNode.connections, newNodeID)\n        if len(targetNode.connections) > idx.M {\n            targetNode.pruneConnections(idx.M)\n        }\n        targetNode.Unlock()\n    }\n}",
    "verification": "Run a concurrency test with 100+ goroutines performing simultaneous upserts and deletions. Use a graph integrity checker to verify that all nodes are reachable and that 'M' constraints are satisfied.",
    "date": "2026-02-22",
    "id": 1771723086,
    "type": "error"
});