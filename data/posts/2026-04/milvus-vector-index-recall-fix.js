window.onPostDataLoaded({
    "title": "Mitigating Vector Index Recall Degradation in Milvus",
    "slug": "milvus-vector-index-recall-fix",
    "language": "Python",
    "code": "MilvusRecallDrop",
    "tags": [
        "Python",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-churn environments where Milvus clusters experience frequent UPSERT and DELETE operations, the vector index recall rate often drops over time. This happens because Milvus uses 'soft deletes', marking records as deleted without immediately restructuring the HNSW or IVF index. Over time, the navigation paths in the graph become inefficient, and the search space becomes cluttered with tombstones.</p>",
    "root_cause": "Index fragmentation and stale global statistics caused by high deletion rates that bypass immediate index rebuilding.",
    "bad_code": "from pymilvus import Collection\n# High churn loop\nfor batch in data_stream:\n    collection.insert(batch)\n    collection.delete(f'id in [{batch[0].id}]')\n# Search results start losing accuracy",
    "solution_desc": "Force manual compaction to merge segments and remove deleted entities, followed by an index rebuild. Adjust the M and efConstruction parameters for HNSW if the data distribution has shifted significantly.",
    "good_code": "collection.flush()\ncollection.compact()\nwhile collection.get_compaction_state().state != CompactionState.Completed:\n    time.sleep(1)\n# Optional: Rebuild index if recall is below threshold\ncollection.drop_index()\ncollection.create_index(field_name='vector', index_params={'index_type': 'HNSW', 'params': {'M': 16, 'efConstruction': 256}})",
    "verification": "Run a benchmark script comparing search results against a ground-truth set before and after the compaction/rebuild cycle.",
    "date": "2026-04-04",
    "id": 1775285403,
    "type": "error"
});