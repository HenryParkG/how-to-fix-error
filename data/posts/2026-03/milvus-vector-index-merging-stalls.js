window.onPostDataLoaded({
    "title": "Mitigating Vector Index Merging Stalls in Milvus",
    "slug": "milvus-vector-index-merging-stalls",
    "language": "Go",
    "code": "MergeStall",
    "tags": [
        "Kubernetes",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-ingest Milvus clusters, users often observe a sudden drop in throughput and high CPU spikes. This is usually caused by 'Index Merging Stalls.' When Milvus receives data, it creates small segments that must eventually be merged and indexed (HNSW/IVF). If the ingestion rate exceeds the compaction and indexing velocity, the DataNode triggers backpressure, stalling the entire pipeline.</p>",
    "root_cause": "The `index_file_size` and `max_segment_size` parameters are set too low for the ingestion volume, causing too many small indexing tasks that saturate the IndexNode pool.",
    "bad_code": "dataCoord:\n  segment:\n    maxSize: 512 # Default small size\n    sealProportion: 0.12\n# High churn results in too many small HNSW segments",
    "solution_desc": "Increase the segment size to reduce the frequency of merges and tune the `index_file_size` to ensure that IndexNodes work on larger, more efficient batches. Also, adjust the `taskPool` size for the IndexNode to prevent thread starvation.",
    "good_code": "dataCoord:\n  segment:\n    maxSize: 1024 # 1GB segments\n    sealProportion: 0.25\nindexCoord:\n  indexNode:\n    parallelism: 8 # Scale according to CPU cores",
    "verification": "Monitor the 'Compaction Latency' and 'Index Queue Size' metrics in Grafana. The fix is verified when the index queue remains stable despite high-throughput write operations.",
    "date": "2026-03-07",
    "id": 1772875275,
    "type": "error"
});