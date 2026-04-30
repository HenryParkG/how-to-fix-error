window.onPostDataLoaded({
    "title": "Mitigating HNSW Index Fragmentation in Vector Databases",
    "slug": "hnsw-index-fragmentation-fix",
    "language": "Python",
    "code": "HNSWPerfDegradation",
    "tags": [
        "SQL",
        "Python",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indexes are the gold standard for vector similarity search, but they suffer significantly from 'High Churn' (high frequency of updates and deletes). Most vector databases implement deletes as 'tombstones'. Over time, the HNSW graph becomes riddled with logical holes, causing search paths to lengthen and recall accuracy to drop.</p><p>This fragmentation increases the latency of the 'efSearch' phase as the algorithm traverses dead nodes to find valid neighbors.</p>",
    "root_cause": "Cumulative graph sparsity and broken navigational paths caused by a high ratio of tombstoned vectors relative to active nodes in the HNSW layers.",
    "bad_code": "# Example of high-churn pattern causing fragmentation\nfor record in high_velocity_stream:\n    vector_db.delete(id=record.id) # Immediate tombstoning\n    vector_db.insert(vector=record.vec, id=record.id)",
    "solution_desc": "Implement a 'Compact-on-Idle' strategy or trigger a manual index rebuild once the tombstone ratio exceeds a threshold (typically 20%). Additionally, adjusting the 'm' (max connections) and 'ef_construct' parameters higher can provide more redundant paths, making the graph more resilient to node removals.",
    "good_code": "def optimize_index(client, collection_name):\n    stats = client.get_collection_stats(collection_name)\n    if stats['deleted_count'] / stats['total_count'] > 0.2:\n        # Trigger background optimization/rebuild\n        client.update_collection(\n            collection_name, \n            optimizer_config={\"deleted_threshold\": 0.1}\n        )",
    "verification": "Monitor the 'Recall@K' metric and search latency. If latency drops after a 'rebuild' command, fragmentation was the cause.",
    "date": "2026-04-30",
    "id": 1777528212,
    "type": "error"
});