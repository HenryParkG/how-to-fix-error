window.onPostDataLoaded({
    "title": "Fixing Milvus HNSW Index Memory Bloat and Recall Drop",
    "slug": "fix-milvus-hnsw-memory-bloat-recall-degradation",
    "language": "Python / C++ / Milvus",
    "code": "Memory Bloat / OOM",
    "tags": [
        "Milvus",
        "Vector DB",
        "Python",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>During continuous, real-time vector ingestion in Milvus, the HNSW (Hierarchical Navigable Small World) index can experience severe memory inflation alongside degradation in nearest-neighbor recall accuracy. This occurs when small segments are flushed frequently, forcing Milvus to maintain multiple small HNSW graphs rather than a unified index.</p><p>As streaming writes write vectors to growing uncompacted segments, knowhere (Milvus' underlying vector execution engine) keeps multiple redundant graph entry points in RAM, causing memory overhead to spike up to 3-4x baseline requirements while reducing search recall by up to 25%.</p>",
    "root_cause": "Frequent auto-flushes trigger premature index creation on micro-segments, generating excessive cross-segment graph overhead, redundant memory structures, and non-optimal edge connectivity within individual HNSW sub-graphs.",
    "bad_code": "from pymilvus import Collection, FieldSchema, CollectionSchema, DataType\n\n# Misconfigured collection prone to high segment fragmentation\ncollection = Collection(\"vector_stream\")\nindex_params = {\n    \"metric_type\": \"L2\",\n    \"index_type\": \"HNSW\",\n    \"params\": {\"M\": 64, \"efConstruction\": 512} # M too high for small micro-segments\n}\ncollection.create_index(field_name=\"vector\", index_params=index_params)\n\n# Ingesting vectors with explicit frequent flushes\nfor batch in vector_batches:\n    collection.insert(batch)\n    collection.flush() # BAD: Triggers micro-segment creation & premature indexing",
    "solution_desc": "Optimize segment size settings by tuning `dataNode.segment.maxSize` to 512MB+, adjust `M` (max graph degree) and `efConstruction` relative to segment size, avoid manual calls to `.flush()`, and schedule periodic background compaction jobs before triggering index builds.",
    "good_code": "from pymilvus import Collection, utility\n\n# 1. Optimize HNSW parameters for compact segments\nindex_params = {\n    \"metric_type\": \"COSINE\",\n    \"index_type\": \"HNSW\",\n    \"params\": {\"M\": 16, \"efConstruction\": 200}\n}\n\n# 2. Ingest stream without explicit micro-flushes\ncollection = Collection(\"vector_stream\")\nfor batch in vector_batches:\n    collection.insert(batch)\n    # Allow Milvus auto-compaction to manage segment flushing naturally\n\n# 3. Explicitly execute compaction prior to explicit bulk index building\ncollection.compact()\nutility.wait_for_compaction_completed(collection.name)\ncollection.create_index(field_name=\"vector\", index_params=index_params)",
    "verification": "Evaluate recall using `pymilvus` search benchmarks against ground-truth datasets. Check memory utilization on vector nodes via Prometheus metrics (`milvus_node_realtime_memory_bytes`) to verify index RAM drops back to normal operational levels.",
    "date": "2026-08-12",
    "id": 1786496789,
    "type": "error"
});