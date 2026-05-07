window.onPostDataLoaded({
    "title": "Fix HNSW Index Corruption in Vector DBs",
    "slug": "hnsw-vector-db-corruption-fix",
    "language": "Go",
    "code": "IndexCorruption",
    "tags": [
        "Go",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Distributed vector databases often use HNSW (Hierarchical Navigable Small World) graphs for fast similarity searches. Corruption typically occurs during high-concurrency 'upsert' operations where node links are updated across multiple layers without atomic consistency. In distributed setups, a network partition or a node crash during the 'link' phase can leave dangling pointers in the graph structure.</p>",
    "root_cause": "Lack of Write-Ahead Logging (WAL) for graph adjacency list updates and race conditions during layer-link synchronization in concurrent writers.",
    "bad_code": "func (idx *HNSW) AddNode(id uint32, vec []float32) {\n    neighbors := idx.search(vec)\n    // Race condition: neighbors might change before this update\n    idx.layers[0].links[id] = neighbors\n}",
    "solution_desc": "Implement a Read-Copy-Update (RCU) pattern for adjacency lists and use a persistent Write-Ahead Log to ensure graph integrity. Ensure all graph updates are performed under a mutex or using atomic pointer swaps (CAS) to maintain layer consistency.",
    "good_code": "func (idx *HNSW) AddNode(id uint32, vec []float32) {\n    idx.mu.Lock()\n    defer idx.mu.Unlock()\n    neighbors := idx.search(vec)\n    idx.wal.LogAddition(id, neighbors)\n    idx.layers[0].links.Store(id, neighbors)\n}",
    "verification": "Perform a 'sanity' walk of the graph layers to ensure every node ID referenced in a link actually exists in the node registry.",
    "date": "2026-05-07",
    "id": 1778119264,
    "type": "error"
});