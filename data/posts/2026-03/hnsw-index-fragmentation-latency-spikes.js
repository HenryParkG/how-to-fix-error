window.onPostDataLoaded({
    "title": "Mitigating HNSW Index Fragmentation in Vector DBs",
    "slug": "hnsw-index-fragmentation-latency-spikes",
    "language": "C++",
    "code": "LatencySpike",
    "tags": [
        "SQL",
        "Infra",
        "VectorDB",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indexes are the gold standard for Approximate Nearest Neighbor (ANN) search. However, they are inherently immutable in structure. When vector databases perform frequent updates or deletes, they don't usually 're-balance' the graph immediately.</p><p>Instead, they mark nodes as deleted (tombstoning). Over time, these tombstones create 'holes' in the graph, increasing the search path length and causing significant query latency spikes. Furthermore, fragmented memory layout reduces CPU cache locality during the graph traversal phase.</p>",
    "root_cause": "Accumulation of logical deletes (tombstones) in the HNSW graph layers leads to suboptimal routing paths and increased hop counts during neighbor traversal.",
    "bad_code": "for i in range(1000000):\n    # Continuous update pattern without compaction\n    vector_db.delete(id=i)\n    vector_db.insert(id=i, vector=new_vector[i])\n# Latency increases by 4x over time",
    "solution_desc": "Implement a 'compact-on-idle' strategy or trigger a manual index rebuild (vacuuming) once the tombstone ratio exceeds a threshold (typically 10-15%). Use 'Copy-on-Write' during rebuilds to maintain availability.",
    "good_code": "def maintenance_loop(vector_db):\n    stats = vector_db.get_stats()\n    if stats['tombstone_ratio'] > 0.15:\n        # Trigger background index optimization/rebuild\n        vector_db.optimize(wait_for_completion=False, target_fragmentation=0.01)",
    "verification": "Measure P99 query latency before and after calling the optimize/rebuild command; a 50-80% reduction in latency is typical for fragmented indexes.",
    "date": "2026-03-06",
    "id": 1772771272,
    "type": "error"
});