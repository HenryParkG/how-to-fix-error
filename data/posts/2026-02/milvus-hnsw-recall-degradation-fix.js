window.onPostDataLoaded({
    "title": "Resolving Milvus HNSW Recall Degradation",
    "slug": "milvus-hnsw-recall-degradation-fix",
    "language": "Python",
    "code": "RecallLoss",
    "tags": [
        "Python",
        "Infra",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Users of Milvus often observe a significant drop in search recall (accuracy) when performing heavy concurrent upserts on HNSW-indexed collections. This happens because the HNSW (Hierarchical Navigable Small World) graph construction is optimized for batch builds. During high-concurrency upserts, the background compaction and index-building threads can create fragmented segments with suboptimal graph connectivity, leading to 'isolated islands' in the vector space that the search algorithm cannot reach.</p>",
    "root_cause": "Small segment sizes and low 'efConstruction' values during incremental indexing. When segments are too small, the graph connectivity is sparse; when merged, the global graph structure is not re-optimized sufficiently.",
    "bad_code": "collection.create_index(\n    field_name=\"vector\",\n    index_params={\n        \"index_type\": \"HNSW\",\n        \"metric_type\": \"L2\",\n        \"params\": {\"M\": 8, \"efConstruction\": 40}\n    }\n)",
    "solution_desc": "Increase the 'M' (max degree of nodes) and 'efConstruction' (entry factor) to ensure denser graph connectivity. Additionally, trigger a manual compaction or set a larger 'segment.maxSize' in the Milvus configuration to ensure larger, more coherent HNSW graphs are built during the merging phase.",
    "good_code": "index_params = {\n    \"index_type\": \"HNSW\",\n    \"metric_type\": \"L2\",\n    \"params\": {\n        \"M\": 32, \n        \"efConstruction\": 256 // Higher values improve recall significantly\n    }\n}\ncollection.create_index(\"vector\", index_params)\n# Ensure search ef is also tuned\nsearch_params = {\"metric_type\": \"L2\", \"params\": {\"ef\": 128}}",
    "verification": "Perform a benchmark using the `ANN-Benchmarks` tool or a custom script comparing recall against a Ground Truth set before and after the parameter adjustment.",
    "date": "2026-02-17",
    "id": 1771303690,
    "type": "error"
});