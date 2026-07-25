window.onPostDataLoaded({
    "title": "Fixing Lucene Segment Merge Starvation in Elasticsearch",
    "slug": "fixing-elasticsearch-lucene-segment-merge-starvation",
    "language": "Java / Elasticsearch",
    "code": "EsRejectedExecutionException",
    "tags": [
        "Elasticsearch",
        "Lucene",
        "Java",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>During high-throughput bulk ingestion workloads, Elasticsearch creates a large volume of small Lucene segment files on disk. Lucene's <code>ConcurrentMergeScheduler</code> asynchronously merges these small segments into larger ones. If the ingestion rate outpaces background segment merges, Lucene exhausts available thread pool workers. This triggers thread starvation, causing the bulk queue to saturate and reject incoming requests with HTTP 429 status codes (<code>EsRejectedExecutionException</code>).</p>",
    "root_cause": "The default Lucene merge thread throttle and `index.refresh_interval` setting force frequent disk flushes, creating small segments faster than the merge scheduler's max thread limits can consolidate them under standard I/O throughput.",
    "bad_code": "// Default index creation without bulk ingest optimization\nPUT /high_throughput_logs\n{\n  \"settings\": {\n    \"number_of_shards\": 1,\n    \"number_of_replicas\": 1\n    // Missing merge thread tuning and refresh interval limits\n  }\n}",
    "solution_desc": "Optimize segment merging by increasing background merge threads based on underlying storage (SSD/NVMe), disabling indexing refreshes during heavy indexing runs, and enabling asynchronous translog flushes.",
    "good_code": "PUT /high_throughput_logs\n{\n  \"settings\": {\n    \"number_of_shards\": 4,\n    \"number_of_replicas\": 0,\n    \"index.refresh_interval\": \"30s\",\n    \"index.translog.durability\": \"async\",\n    \"index.translog.sync_interval\": \"10s\",\n    \"index.merge.scheduler.max_thread_count\": 4,\n    \"index.merge.policy.max_merged_segment\": \"5gb\",\n    \"index.merge.policy.segments_per_tier\": 24\n  }\n}",
    "verification": "Monitor Elasticsearch node metrics via `GET /_cat/thread_pool/write?v` and `GET /_cat/nodes?h=name,indexing.delete_current,merges.current,merges.total_time`. Confirm that rejected bulk writes drop to 0 and active segment merges remain stable under load.",
    "date": "2026-07-25",
    "id": 1784944177,
    "type": "error"
});