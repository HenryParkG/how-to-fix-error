window.onPostDataLoaded({
    "title": "Fixing HNSW Index Fragmentation and Recall Degradation",
    "slug": "hnsw-index-fragmentation-recall",
    "language": "Python",
    "code": "RecallDegradation",
    "tags": [
        "Python",
        "SQL",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) are the gold standard for vector similarity search. However, they are sensitive to 'tombstoning'\u2014a process where deleted vectors are marked as inactive but remain in the graph structure. In dynamic environments where embeddings are frequently updated or deleted, the graph becomes fragmented.</p><p>This fragmentation breaks the 'small world' property, as the entry points for searches might lead to dead-ends or sub-optimal paths. Consequently, the search recall (the percentage of true neighbors found) drops significantly even if the total vector count remains constant.</p>",
    "root_cause": "Accumulation of logical deletes (tombstones) in the HNSW graph without physical compaction or re-indexing.",
    "bad_code": "import milvus\n# Continuously updating vectors without rebuilding\nfor i in range(1000000):\n    collection.insert(new_vectors)\n    collection.delete(old_vector_ids)",
    "solution_desc": "Implement a periodic compaction strategy or trigger an index rebuild once the deletion ratio exceeds 20%. Additionally, tune the ef_search parameter dynamically to compensate for minor fragmentation at the cost of latency.",
    "good_code": "# Triggering a physical compaction in Milvus/Pinecone context\ncollection.compact()\ncollection.create_index(\n    field_name=\"vector\",\n    index_params={\"index_type\": \"HNSW\", \"metric_type\": \"L2\", \"params\": {\"M\": 16, \"efConstruction\": 256}}\n)",
    "verification": "Compare Search Recall (Recall@K) against a brute-force Flat index baseline before and after compaction.",
    "date": "2026-05-13",
    "id": 1778671561,
    "type": "error"
});