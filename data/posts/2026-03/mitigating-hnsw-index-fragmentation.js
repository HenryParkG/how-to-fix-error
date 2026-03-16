window.onPostDataLoaded({
    "title": "Mitigating HNSW Index Fragmentation",
    "slug": "mitigating-hnsw-index-fragmentation",
    "language": "Rust",
    "code": "VectorDB.GraphDecay",
    "tags": [
        "Rust",
        "Python",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indexes are sensitive to 'tombstoning' in real-time pipelines. When vectors are frequently updated or deleted, the graph topology becomes fragmented. This results in 'dead-end' nodes where the search algorithm cannot traverse to the true nearest neighbors, causing a significant drop in Recall@K performance despite high search speeds.</p>",
    "root_cause": "Logical deletes in HNSW do not automatically re-wire the graph edges, leading to a disconnected or suboptimal navigable structure over time.",
    "bad_code": "// Continuous updates without optimization\nfor vec in incoming_stream {\n    index.delete(vec.id);\n    index.insert(vec.id, vec.vector);\n}",
    "solution_desc": "Implement a 'compaction' threshold based on the ratio of deleted vs. active nodes. When fragmentation exceeds 20%, trigger a background partial rebuild or use an index versioning swap.",
    "good_code": "fn handle_update(index: &mut HNSW, id: u64, vec: Vec<f32>) {\n    index.update(id, vec);\n    if index.deleted_count() as f64 / index.total_count() as f64 > 0.2 {\n        index.rebuild_optimized_layers();\n    }\n}",
    "verification": "Monitor the 'Recall' metric using a hold-out test set; if recall drops below 0.95, trigger the rebuild and verify recovery.",
    "date": "2026-03-16",
    "id": 1773624309,
    "type": "error"
});