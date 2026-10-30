window.onPostDataLoaded({
    "title": "Mitigating Vector HNSW Index Bloat & Recall Drift",
    "slug": "vector-db-hnsw-bloat-recall-drift-mitigation",
    "language": "Python",
    "code": "ERR_INDEX_DEGRADATION",
    "tags": [
        "Python",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In streaming vector systems ingesting high-velocity insert and update streams (e.g., in Qdrant, Milvus, or pgvector), Hierarchical Navigable Small World (HNSW) graphs degrade severely over time. The root mechanism is 'tombstone buildup' and 'edge severance'.</p><p>When an existing vector is updated, vector engines mark the original vertex with a soft delete tombstone and insert the updated vector as a new vertex. Standard HNSW algorithms do not immediately rewire neighbor connections for soft-deleted nodes to preserve low write latencies. Consequently, high-dimensional search paths traverse non-routable tombstones, resulting in search latency degradation, memory bloat, and recall dropping from >98% to <70%.</p>",
    "root_cause": "In-place updates in HNSW indexes created isolated subgraphs and dangling edges through uncompacted tombstones, deteriorating small-world routing efficiency without dynamic graph reconstruction.",
    "bad_code": "from qdrant_client import QdrantClient\nfrom qdrant_client.http import models\n\nclient = QdrantClient(url=\"http://localhost:6333\")\n\n# Naive configuration susceptible to tombstone fragmentation during continuous streaming updates\nclient.create_collection(\n    collection_name=\"realtime_embeddings\",\n    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),\n    hnsw_config=models.HnswConfigDiff(\n        m=16,\n        ef_construct=100,\n        # Missing vacuum/compaction optimization thresholds\n    )\n)",
    "solution_desc": "Architect an asynchronous background maintenance strategy. Configure dynamic index segment thresholds, tune tombstone vacuum thresholds (`max_optimization_threads` and `deleted_threshold`), and route heavy streaming updates to append-only staging indexes with continuous merging and reindexing policies.",
    "good_code": "from qdrant_client import QdrantClient\nfrom qdrant_client.http import models\n\nclient = QdrantClient(url=\"http://localhost:6333\")\n\nclient.create_collection(\n    collection_name=\"realtime_embeddings\",\n    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),\n    hnsw_config=models.HnswConfigDiff(\n        m=32,\n        ef_construct=256,\n        on_disk=True,\n    ),\n    optimizers_config=models.OptimizersConfigDiff(\n        deleted_threshold=0.1,         # Trigger segment vacuuming when >10% are tombstones\n        vacuum_min_vector_number=5000, # Minimum entries before vacuuming starts\n        default_segment_number=4,      # Parallel segments for background merging\n        max_optimization_threads=2\n    )\n)",
    "verification": "Query ground-truth recall metrics continuously using a separate validation set. Ensure graph scan recall stays above 0.95 with `client.get_collection(\"realtime_embeddings\").optimizer_status` reporting healthy status without backlog.",
    "date": "2026-10-30",
    "id": 1793361403,
    "type": "error"
});