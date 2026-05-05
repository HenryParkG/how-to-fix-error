window.onPostDataLoaded({
    "title": "Mitigating Vector DB HNSW Index Fragmentation",
    "slug": "vector-db-hnsw-fragmentation-fix",
    "language": "Go",
    "code": "IndexDegradation",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indexes are highly efficient for ANN search but suffer from significant fragmentation during real-time ingestion. As vectors are updated or deleted, the graph topology becomes suboptimal. New nodes are linked with stale edges, and 'tombstoned' nodes create holes in the high-level layers, leading to increased latency and decreased recall over time.</p>",
    "root_cause": "HNSW graphs lack an automatic re-balancing mechanism during high-frequency mutation, causing the 'Small World' connectivity properties to break down.",
    "bad_code": "// Naive continuous ingestion without maintenance\nfor { \n    record := stream.Read()\n    vectorDB.Insert(record.ID, record.Vector) \n    // No compaction or optimization triggered\n}",
    "solution_desc": "Implement a tiered ingestion strategy. Buffer updates in a flat index or a smaller temporary HNSW, then perform a background merge/re-build (compaction) to optimize the graph structure and prune deleted nodes.",
    "good_code": "// Periodic optimization and background merging\nif ingestionCount % 10000 == 0 {\n    go vectorDB.OptimizeIndex(Config{ \n        MaxEdges: 64, \n        ConstructionEffort: 200 \n    })\n}",
    "verification": "Monitor 'Recall@K' metrics and search latency. If latency remains stable despite millions of updates, the mitigation is successful.",
    "date": "2026-05-05",
    "id": 1777967687,
    "type": "error"
});