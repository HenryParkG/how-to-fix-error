window.onPostDataLoaded({
    "title": "Mitigating Milvus HNSW Vector Recall Decay Under Upserts",
    "slug": "mitigating-milvus-hnsw-graph-recall-decay",
    "language": "Python",
    "code": "MilvusRecallDecay",
    "tags": [
        "Python",
        "Kubernetes",
        "VectorDB",
        "Error Fix"
    ],
    "analysis": "<p>Milvus stores high-dimensional vectors and builds Hierarchical Navigable Small World (HNSW) graphs to provide fast approximate nearest neighbor (ANN) lookups. When an application executes heavy concurrent upserts and deletes, Milvus marks existing vector entities as deleted via tombstones and ingests replacement vectors into separate append-only segments.</p><p>Because HNSW entry points and edge connectivity depend on neighbor distribution computed during index build time, accumulated tombstone nodes fragment the navigable graph layers. The traversal paths encounter dead ends, leading to severe recall decay (accuracy dropping from 98% down to < 70%) and search latency spikes under ongoing ingest.</p>",
    "root_cause": "HNSW graphs suffer path disconnection and navigation traps when frequent upsert/delete operations create large volumes of uncompacted tombstones in Milvus segment partitions.",
    "bad_code": "from pymilvus import Collection, connections\n\nconnections.connect(alias=\"default\", host=\"localhost\", port=\"19530\")\ncollection = Collection(\"knowledge_embeddings\")\n\n# Anti-pattern: High-frequency individual upserts and unconstrained search\ndef update_embeddings(items):\n    for item in items:\n        # Upsert triggers delete followed by insert, creating isolated tombstones\n        collection.delete(f'id in [\"{item[\"id\"]}\"]')\n        collection.insert([[item[\"id\"]], [item[\"vector\"]]])\n    \n    # Searching immediately without triggering compaction or tuning ef\n    results = collection.search(\n        data=[[0.1] * 768],\n        anns_field=\"vector\",\n        param={\"metric_type\": \"L2\", \"params\": {\"ef\": 16}}, # ef too low\n        limit=10\n    )\n    return results",
    "solution_desc": "Batch ingest records instead of using point deletes, tune HNSW search parameters (`ef`) higher during active update windows, and trigger periodic background compactions so Milvus rebuilds clean, tombstone-free HNSW indexes.",
    "good_code": "from pymilvus import Collection, utility, connections\n\nconnections.connect(alias=\"default\", host=\"localhost\", port=\"19530\")\ncollection = Collection(\"knowledge_embeddings\")\n\ndef batch_upsert_and_optimize(ids, vectors):\n    # 1. Batch upsert to reduce fragmented segments\n    collection.upsert([ids, vectors])\n    \n    # 2. Trigger automatic compaction when segment fragmentation is high\n    if collection.compact() != \"\":\n        utility.wait_for_compaction_completed(collection.name)\n\ndef resilient_search(query_vectors):\n    # 3. Increase search-time ef parameter to navigate around temporary tombstones\n    search_params = {\n        \"metric_type\": \"COSINE\",\n        \"params\": {\"ef\": 128} # Higher ef preserves recall despite updates\n    }\n    return collection.search(\n        data=query_vectors,\n        anns_field=\"vector\",\n        param=search_params,\n        limit=10,\n        output_fields=[\"id\"]\n    )",
    "verification": "Compute recall against a brute-force Flat index baseline using a ground-truth dataset while running continuous 200 QPS upserts to confirm recall remains above 95%.",
    "date": "2026-10-18",
    "id": 1792289497,
    "type": "error"
});