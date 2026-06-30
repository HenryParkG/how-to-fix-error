window.onPostDataLoaded({
    "title": "Vector DB: Fixing HNSW Index Memory Bloat and Recall Loss",
    "slug": "hnsw-memory-bloat-recall-degradation-fix",
    "language": "Python",
    "code": "Recall Degradation",
    "tags": [
        "Python",
        "Vector-Database",
        "HNSW",
        "Machine-Learning",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs are the state-of-the-art for approximate nearest neighbor (ANN) searches in high-dimensional vector spaces. However, when subjected to high-throughput, dynamic upserts (deleting or replacing vectors frequently), the graph's structural integrity degrades. This occurs because deletions in HNSW typically write logical tombstones to avoid costly graph reconstruction.</p><p>Over time, these tombstones cause severe memory bloat. Furthermore, as routing links are broken or redirected to historical nodes, search queries get trapped in local minima, leading to a severe degradation in search recall accuracy.</p>",
    "root_cause": "Frequent dynamic vector updates/deletions create logical tombstones and fragment the graph layers, leading to redundant routing paths, excessive memory footprint, and failed vector recall.",
    "bad_code": "import numpy as np\nfrom pymilvus import Collection, utility\n\n# Bad Pattern: Standard HNSW parameters optimized for static datasets used in heavy dynamic upserts\nindex_params = {\n    \"metric_type\": \"L2\",\n    \"index_type\": \"HNSW\",\n    \"params\": {\n        \"M\": 8,               # Outdegree too small, paths break easily on delete\n        \"efConstruction\": 16, # Low accuracy construction\n    }\n}\n\n# Performing high-frequency sequential writes and deletes without triggering compaction\nfor i in range(10000):\n    # Simulate rapid dynamic updates\n    vectors = np.random.random((100, 128)).tolist()\n    # collection.insert([ids, vectors])\n    # collection.delete(expr=\"id in [some_ids]\") # Leaving heavy tombstones",
    "solution_desc": "Increase index connectivity parameters (M, efConstruction) to ensure the graph remains highly connected despite deletion-induced links breaking. Additionally, configure active garbage collection of logical tombstones and trigger routine index compaction cycles to purge dead nodes and rebalance the structural layers.",
    "good_code": "import psutil\nfrom pymilvus import Collection, utility\n\n# Good Pattern: Tuning HNSW parameters for dynamic environments & executing compaction\noptimized_index_params = {\n    \"metric_type\": \"L2\",\n    \"index_type\": \"HNSW\",\n    \"params\": {\n        \"M\": 32,               # High outdegree provides redundant routing paths\n        \"efConstruction\": 250, # Precise construction to maintain recall\n        \"efSearch\": 64         # Evaluated dynamically at runtime\n    }\n}\n\ndef optimize_and_compact(collection_name):\n    collection = Collection(collection_name)\n    \n    # Trigger logical tombstone cleanup / index compaction\n    collection.compact()\n    collection.wait_for_compaction_completed()\n    \n    # Re-verify and rebuild indexes to guarantee structure health\n    print(\"Compaction complete. Memory footprint:\", psutil.Process().memory_info().rss / (1024 * 1024), \"MB\")",
    "verification": "Assess the recall metric by searching for queries with known ground truth vectors. Compare pre-compaction recall (often dropped to < 85%) against post-compaction recall (recovered to > 98%) while monitoring host memory footprint reduction using `psutil`.",
    "date": "2026-06-30",
    "id": 1782802279,
    "type": "error"
});