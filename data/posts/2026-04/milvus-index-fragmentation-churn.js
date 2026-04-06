window.onPostDataLoaded({
    "title": "Fixing Vector Index Fragmentation in Milvus",
    "slug": "milvus-index-fragmentation-churn",
    "language": "Python",
    "code": "MILVUS_FRAG_DEGRADATION",
    "tags": [
        "Infra",
        "SQL",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>High-churn Milvus collections (frequent updates/deletes) suffer from index fragmentation because Milvus uses a Log-Structured Merge approach. Deletions are marked in delta files, but the underlying vector index segments aren't immediately rebuilt. Over time, search performance drops as the system scans stale data and applies delete masks at runtime.</p>",
    "root_cause": "Accumulation of tombstone records in segments and outdated IVF/HNSW index structures that do not reflect the current data distribution.",
    "bad_code": "# Simple deletion without maintenance\ncollection.delete(\"id in [1, 2, 3]\")\n# Search performance degrades over 100k such operations\nresults = collection.search(query_vectors, \"vector\", search_params, limit=10)",
    "solution_desc": "Trigger manual compaction to merge small segments and remove deleted records, followed by an index rebuild. Use a threshold-based background task to monitor segment fragmentation levels.",
    "good_code": "# Trigger compaction to reclaim space\ncollection.compact()\ncollection.wait_for_compaction_completed()\n\n# Rebuild index for optimized search\ncollection.drop_index()\nindex_params = {\"index_type\": \"HNSW\", \"metric_type\": \"L2\", \"params\": {\"M\": 8, \"efConstruction\": 64}}\ncollection.create_index(field_name=\"vector\", index_params=index_params)",
    "verification": "Compare search latency and memory usage before and after compaction using Milvus Prometheus metrics.",
    "date": "2026-04-06",
    "id": 1775452578,
    "type": "error"
});