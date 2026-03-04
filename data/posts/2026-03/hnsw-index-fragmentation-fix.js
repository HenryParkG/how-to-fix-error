window.onPostDataLoaded({
    "title": "Mitigating Vector DB Index Fragmentation in HNSW Graphs",
    "slug": "hnsw-index-fragmentation-fix",
    "language": "Go",
    "code": "GraphFragmentation",
    "tags": [
        "VectorDB",
        "HNSW",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Dynamic HNSW (Hierarchical Navigable Small World) graphs suffer from fragmentation when performing frequent updates and deletions. In many implementations, deleting a vector merely marks a node as 'tombstoned' without re-linking its neighbors. Over time, this creates 'island' nodes and breaks the 'small world' property, significantly degrading recall accuracy and increasing search latency as the entry points become suboptimal.</p>",
    "root_cause": "Accumulation of tombstoned nodes and stale edges that prevent efficient traversal through the graph layers.",
    "bad_code": "func (index *HNSW) Delete(id uint64) {\n    index.nodes[id].deleted = true\n    // No re-linking logic leads to broken graph paths\n}",
    "solution_desc": "Implement an 'Incremental Healing' strategy. When a node is deleted, trigger a neighborhood search for its connections and re-establish edges between its predecessor and successor nodes. Periodically run a compaction routine to remove tombstones and re-insert orphaned nodes.",
    "good_code": "func (index *HNSW) DeleteAndHeal(id uint64) {\n    neighbors := index.nodes[id].neighbors\n    index.tombstones.Add(id)\n    for _, n := range neighbors {\n        index.RepairConnections(n) // Re-links neighbors to maintain connectivity\n    }\n    if index.TombstoneRatio() > 0.2 {\n        go index.Compact()\n    }\n}",
    "verification": "Measure the 'Recall@K' metric before and after a high-churn workload. Use a graph visualizer to check for disconnected components.",
    "date": "2026-03-04",
    "id": 1772616741,
    "type": "error"
});