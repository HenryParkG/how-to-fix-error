window.onPostDataLoaded({
    "title": "Mitigating Recall Loss in High-Churn Milvus Collections",
    "slug": "milvus-vector-recall-loss-fix",
    "language": "Python",
    "code": "Recall Degradation",
    "tags": [
        "Python",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>High-churn collections in Milvus (frequent inserts, deletes, and updates) suffer from index fragmentation. When vectors are deleted, they are marked as 'soft-deleted' in segments. This creates 'holes' in the IVF (Inverted File) clusters, leading to inaccurate centroid calculation during search and a significant drop in recall rate because the index no longer represents the current distribution of data.</p>",
    "root_cause": "The IVF index centroids become stale as data distribution shifts through updates, and 'soft-deleted' records remain in memory/disk segments until a manual compaction and re-indexing process is triggered.",
    "bad_code": "# Standard search without maintenance\nfrom pymilvus import Collection\n\ncollection = Collection(\"high_churn_data\")\n# Frequent inserts and deletes happening here...\nresults = collection.search(query_vectors, \"vector_field\", search_params, limit=10)",
    "solution_desc": "Implement an automated maintenance routine that monitors the 'delete_count' and triggers 'compact()' followed by an asynchronous 'create_index()' with the 'replace_index' flag to refresh centroids.",
    "good_code": "from pymilvus import Collection\n\ncollection = Collection(\"high_churn_data\")\nif collection.num_entities > threshold and delete_ratio > 0.2:\n    collection.compact()\n    collection.wait_for_compaction_completed()\n    # Force rebuild index to refresh centroids\n    collection.drop_index()\n    collection.create_index(field_name=\"vector_field\", index_params=idx_params)",
    "verification": "Compare the 'Recall@K' metric before and after compaction using a ground-truth validation set.",
    "date": "2026-03-27",
    "id": 1774587728,
    "type": "error"
});