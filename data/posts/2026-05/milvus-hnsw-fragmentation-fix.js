window.onPostDataLoaded({
    "title": "Resolving Milvus HNSW Index Fragmentation",
    "slug": "milvus-hnsw-fragmentation-fix",
    "language": "Milvus",
    "code": "IndexFragmentation",
    "tags": [
        "SQL",
        "Infra",
        "VectorDB",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency upsert scenarios, Milvus generates numerous small segments. The HNSW (Hierarchical Navigable Small World) index relies on a cohesive graph structure. Frequent insertions and deletions trigger rapid background indexing on these small segments, leading to graph fragmentation. This reduces the 'efSearch' efficiency and causes a significant drop in Recall rates and increased query latency as the search traverses suboptimal, disconnected graph components.</p>",
    "root_cause": "Excessive small segments created by frequent flush() calls and lack of proactive segment compaction prevent the HNSW algorithm from building a globally optimal navigation graph.",
    "bad_code": "from pymilvus import Collection\n# Triggering fragmentation via rapid small inserts\nfor data in stream:\n    collection.insert(data)\n    collection.flush() # Force flush creates tiny segments",
    "solution_desc": "Implement a batching strategy to minimize segment count, increase the 'index_file_size' threshold, and manually trigger 'compact()' operations during low-traffic windows to merge small HNSW segments into a single optimized graph.",
    "good_code": "# Use bulk inserts and manual compaction\nbatch = []\nfor data in stream:\n    batch.append(data)\n    if len(batch) >= 5000:\n        collection.insert(batch)\n        batch = []\n\ncollection.compact()\ncollection.wait_for_compaction_completed()",
    "verification": "Check the segment count via `describe_collection` and monitor search latency/recall consistency using the Milvus monitoring dashboard.",
    "date": "2026-05-08",
    "id": 1778224614,
    "type": "error"
});