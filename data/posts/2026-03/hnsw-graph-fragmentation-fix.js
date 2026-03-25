window.onPostDataLoaded({
    "title": "Mitigating HNSW Graph Fragmentation in Vector DBs",
    "slug": "hnsw-graph-fragmentation-fix",
    "language": "Go",
    "code": "HNSW_FRAG_LEAK",
    "tags": [
        "Go",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput vector databases, constant upsert cycles\u2014effectively a delete followed by an insert\u2014create 'orphaned' nodes in the Hierarchical Navigable Small World (HNSW) graph. Because HNSW relies on a delicate multi-layered hierarchy of links, simply marking a node as deleted (soft delete) without immediately re-linking its neighbors leads to suboptimal search paths. Over time, the graph becomes fragmented, increasing the distance traveled during the 'greedy search' phase and significantly spiking P99 latency.</p>",
    "root_cause": "The graph maintenance logic fails to perform immediate neighbor re-linking during high-frequency updates, leading to a breakdown in the 'small world' property as entry points point to tombstones.",
    "bad_code": "func (idx *HNSW) Upsert(id uint64, vec []float32) {\n    // Problem: Soft delete only\n    idx.nodes[id].deleted = true\n    // New node is added but old links stay stale\n    idx.Insert(id, vec)\n    // Graph connectivity is never re-validated\n}",
    "solution_desc": "Implement an incremental 'repair-on-update' strategy. When a node is deleted or updated, trigger a localized re-link of its nearest neighbors in the top layers. Additionally, maintain a dynamic entry point selection that bypasses nodes marked with tombstones.",
    "good_code": "func (idx *HNSW) Upsert(id uint64, vec []float32) {\n    idx.Lock()\n    defer idx.Unlock()\n    if oldNode, exists := idx.nodes[id]; exists {\n        idx.relinkNeighbors(oldNode)\n        delete(idx.nodes, id)\n    }\n    newNode := idx.Insert(id, vec)\n    idx.ensureConnectivity(newNode)\n}",
    "verification": "Run a benchmark with a 50/50 mix of searches and upserts. Monitor the 'mean hops per query' metric; if it stays constant despite high churn, the fragmentation is mitigated.",
    "date": "2026-03-25",
    "id": 1774414168,
    "type": "error"
});