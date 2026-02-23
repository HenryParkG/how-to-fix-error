window.onPostDataLoaded({
    "title": "Fixing HNSW Recall Decay in Vector DBs",
    "slug": "hnsw-recall-decay-fix",
    "language": "Go",
    "code": "SearchRecallError",
    "tags": [
        "Go",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>When performing massive incremental upserts in HNSW-based vector databases, the graph structure often suffers from 'connectivity entropy.' As new nodes are added without re-balancing the hierarchical layers, the entry points become stale. This leads to a significant drop in recall because the search path fails to navigate to the optimal local neighborhood in the high-dimensional space.</p>",
    "root_cause": "The M and ef_construction parameters become insufficient for the new data distribution, and the graph lacks periodic global optimization (compaction).",
    "bad_code": "func updateIndex(index *hnsw.Index, vec []float32) {\n  // Standard upsert without adjusting search effort\n  index.Insert(vec)\n  // Over time, recall drops from 0.99 to 0.85\n}",
    "solution_desc": "Implement a dynamic 'ef' scaling strategy during upserts and trigger a background graph optimization or 're-linking' phase when the node count increases by a specific threshold (e.g., 20%). Increase the search effort (ef) temporarily during high-churn periods.",
    "good_code": "func updateIndexOptimized(index *hnsw.Index, vec []float32, count int) {\n  if count % 1000 == 0 {\n    index.SetEf(200) // Increase construction search depth\n  }\n  index.Insert(vec)\n  if count % 10000 == 0 {\n    go index.OptimizeConnectivity() // Re-index stale nodes\n  }\n}",
    "verification": "Run a benchmark script comparing search results against a brute-force Flat index. If recall stays > 0.98 after 1M upserts, the fix is valid.",
    "date": "2026-02-23",
    "id": 1771811397,
    "type": "error"
});