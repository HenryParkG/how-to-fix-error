window.onPostDataLoaded({
    "title": "Fix Lucene Merge Storms & Write Threadpool Starvation",
    "slug": "elasticsearch-lucene-merge-storms-threadpool-starvation",
    "language": "Java",
    "code": "EsRejectedExecutionException",
    "tags": [
        "Java",
        "Docker",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch clusters ingesting high-volume data streams can experience cascading node degradation characterized by write threadpool saturation and <code>EsRejectedExecutionException</code>. Under default index settings, periodic segment flushes write numerous small Lucene segments to disk.</p><p>As segment counts mount, Lucene's <code>TieredMergePolicy</code> initiates concurrent merge operations across large segment tiers. These heavy I/O operations exhaust disk bandwidth and saturate CPU cycles. Consequently, incoming index requests queue up in the write threadpool until capacity is exceeded, causing indexing operations to fail with HTTP 429 errors.</p>",
    "root_cause": "Aggressive Lucene segment merges trigger excessive disk I/O and CPU contention during ingestion bursts, starving the write threadpool and exhausting request queues.",
    "bad_code": "PUT /telemetry-logs\n{\n  \"settings\": {\n    \"index\": {\n      \"refresh_interval\": \"1s\",\n      \"number_of_shards\": 1,\n      \"translog.durability\": \"request\"\n    }\n  }\n}",
    "solution_desc": "Throttle background merge concurrency, lengthen the refresh interval during ingestion, and set translog durability to asynchronous execution to prevent I/O bottlenecks and threadpool saturation.",
    "good_code": "PUT /telemetry-logs/_settings\n{\n  \"index\": {\n    \"refresh_interval\": \"30s\",\n    \"translog.durability\": \"async\",\n    \"translog.sync_interval\": \"10s\",\n    \"merge.scheduler.max_thread_count\": 1,\n    \"merge.policy\": {\n      \"max_merged_segment\": \"5gb\",\n      \"segments_per_tier\": 20,\n      \"max_merge_at_once\": 10\n    }\n  }\n}",
    "verification": "Check rejected task counts using `GET /_cat/thread_pool/write?v&h=node_name,active,queue,rejected` and confirm `rejected` remains 0. Verify merge stats with `GET /telemetry-logs/_stats/merges`.",
    "date": "2026-10-31",
    "id": 1793417257,
    "type": "error"
});