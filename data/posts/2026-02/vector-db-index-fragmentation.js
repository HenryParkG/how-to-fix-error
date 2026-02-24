window.onPostDataLoaded({
    "title": "Fixing Vector DB HNSW Index Fragmentation",
    "slug": "vector-db-index-fragmentation",
    "language": "Python",
    "code": "INDEX_DEGRADE",
    "tags": [
        "Python",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Vector databases using HNSW (Hierarchical Navigable Small Worlds) suffer from performance degradation during frequent updates. Since HNSW graphs are immutable at the node-link level during high-concurrency writes, 'deletes' are often marked as tombstones. Over time, the graph structure becomes sparse, increasing the number of hops required for nearest neighbor searches and significantly bloating memory usage.</p>",
    "root_cause": "Excessive tombstone accumulation and edge-link staleness in the HNSW graph following high-frequency DELETE and UPSERT operations.",
    "bad_code": "from vector_db_client import Client\n\nclient = Client(\"localhost:8080\")\n# Constant upserting without maintenance\nfor embedding in embedding_stream:\n    client.collection(\"docs\").upsert(\n        id=embedding.id, \n        vector=embedding.values\n    )",
    "solution_desc": "Implement a 'compact-on-threshold' strategy. Monitor the 'deleted_doc_ratio' and trigger an index rebuild or a segment merge once tombstones exceed 20% of the total index size. Alternatively, use 'Force Merge' APIs provided by engines like Milvus or Weaviate.",
    "good_code": "def maintenance_loop(client, collection_name):\n    stats = client.collection(collection_name).stats()\n    tombstone_ratio = stats['deleted_count'] / stats['total_count']\n    \n    if tombstone_ratio > 0.20:\n        print(\"Fragmentation detected. Starting index compaction...\")\n        client.collection(collection_name).compact()\n        # Optional: Rebuild index for optimal graph connectivity\n        client.collection(collection_name).rebuild_index(type=\"HNSW\")",
    "verification": "Compare query Latency (p99) before and after compaction. A healthy index should show a 30-50% reduction in latency if fragmentation was the cause.",
    "date": "2026-02-24",
    "id": 1771915851,
    "type": "error"
});