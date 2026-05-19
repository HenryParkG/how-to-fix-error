window.onPostDataLoaded({
    "title": "Mitigating HNSW Index Fragmentation in Vector DBs",
    "slug": "mitigating-hnsw-index-fragmentation",
    "language": "Rust / SQL",
    "code": "Search-Recall-Degradation",
    "tags": [
        "Rust",
        "SQL",
        "Infra",
        "VectorDB",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) are the gold standard for ANN search. However, in high-update environments, HNSW indices suffer from fragmentation. When vectors are updated or deleted, the graph structure becomes riddled with tombstones or orphaned nodes. This leads to 'graph holes' where search traversals fail to find the nearest neighbors even if they exist, causing recall to drop and latency to spike as the engine traverses dead links.</p>",
    "root_cause": "HNSW is an immutable-friendly structure. Frequent logical deletes mark nodes as 'deleted' without restructuring the graph edges, leading to suboptimal routing and increased memory bloat.",
    "bad_code": "-- Continuous upserts without compaction\nLOOP\n  INSERT INTO vector_table (id, embedding) \n  VALUES (id, vec) \n  ON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding;\nEND LOOP;",
    "solution_desc": "Implement a background compaction strategy that rebuilds segments once a tombstone threshold is reached. Use a 'Copy-on-Write' mechanism for index updates where updated nodes are re-inserted into a new segment and merged later, similar to LSM-trees.",
    "good_code": "// Qdrant/Milvus style optimization config\n{\n  \"indexing_threshold\": 10000,\n  \"memmap_threshold\": 20000,\n  \"flush_interval_sec\": 30,\n  \"max_optimization_threads\": 2\n}",
    "verification": "Monitor the 'Recall@K' metric against a ground-truth set and track the 'deleted_record_ratio' in the index metadata.",
    "date": "2026-05-19",
    "id": 1779191762,
    "type": "error"
});