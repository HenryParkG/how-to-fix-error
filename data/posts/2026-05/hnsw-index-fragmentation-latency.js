window.onPostDataLoaded({
    "title": "Mitigating HNSW Index Fragmentation and Latency Drift",
    "slug": "hnsw-index-fragmentation-latency",
    "language": "Rust",
    "code": "VECTOR_SEARCH_DRIFT",
    "tags": [
        "Rust",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) indexes are susceptible to fragmentation when subjected to high-frequency updates and deletions. Unlike traditional B-Trees, HNSW relies on specific graph connectivity to maintain logarithmic search speeds.</p><p>Over time, deleted nodes (marked as tombstones) leave 'holes' in the graph levels, causing search queries to traverse sub-optimal paths, leading to significant latency drift and recall degradation.</p>",
    "root_cause": "The HNSW algorithm does not natively re-balance neighbor links upon deletion. Tombstones stay in memory to maintain graph integrity, but they increase the effective radius of search hops.",
    "bad_code": "for doc in documents_to_update {\n    index.delete(doc.id); // Simple logical deletion\n    index.insert(doc.id, doc.embedding);\n    // No maintenance or vacuuming performed\n}",
    "solution_desc": "Implement an incremental 'compact and repair' strategy. Periodically identify nodes with low connectivity or high tombstone density and trigger a neighbor re-linking process (re-indexing sub-graphs) rather than a full index rebuild.",
    "good_code": "fn maintenance_task(index: &mut HNSWIndex) {\n    let fragmented_nodes = index.find_fragmented_regions(0.2); // 20% threshold\n    for node_id in fragmented_nodes {\n        index.relink_neighbors(node_id, MAX_EDGES);\n        index.vacuum_tombstones(node_id);\n    }\n}",
    "verification": "Monitor the 'Recall@K' metric and p99 latency. A healthy index should maintain stable recall even after 30% of the data has been updated.",
    "date": "2026-05-02",
    "id": 1777699770,
    "type": "error"
});