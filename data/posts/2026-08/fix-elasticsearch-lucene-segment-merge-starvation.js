window.onPostDataLoaded({
    "title": "Fix Elasticsearch Merge Starvation Under Heavy Bulk Ingestion",
    "slug": "fix-elasticsearch-lucene-segment-merge-starvation",
    "language": "Java",
    "code": "MergeStarvation",
    "tags": [
        "Elasticsearch",
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>During high-throughput bulk indexing operations in Elasticsearch, Lucene creates numerous small immutable index segments on disk after every flush interval. As these segments accumulate, Lucene's <code>ConcurrentMergeScheduler</code> continuously runs background threads to merge smaller segments into larger ones.</p><p>Under continuous heavy bulk indexing, the rate of newly created segments exceeds the speed at which Lucene can merge them. This results in segment merge starvation: index operations hit a write throttle, write queues fill up, HTTP 429 <code> EsRejectedExecutionException</code> errors occur, and shard indexing stalls completely.</p>",
    "root_cause": "The default Lucene ConcurrentMergeScheduler max thread count and TieredMergePolicy parameters are undersized for high-speed SSD/NVMe disk I/O, coupled with frequent translog flushes and short refresh intervals generating an unmanageable volume of small segments.",
    "bad_code": "// Bad Configuration (Elasticsearch Index Settings API / Java Client)\nPUT /high-throughput-index/_settings\n{\n  \"index\": {\n    \"refresh_interval\": \"1s\",\n    \"number_of_replicas\": 2,\n    \"translog.durability\": \"request\",\n    \"merge.scheduler.max_thread_count\": \"1\" // Bottlenecks merges on multi-core SSD servers\n  }\n}",
    "solution_desc": "1. Temporarily disable or increase the `refresh_interval` (e.g. to 30s) during bulk ingest runs to reduce small segment creation.\n2. Configure `translog.durability` to `async` for lower disk write contention.\n3. Increase `index.merge.scheduler.max_thread_count` dynamically based on modern multi-core NVMe host hardware.\n4. Tune Lucene TieredMergePolicy settings (`max_merge_at_once` and `segments_per_tier`) to process larger segment batches simultaneously.",
    "good_code": "// Fixed Index Settings (Java High-Level REST Client / Elasticsearch API)\nPUT /high-throughput-index/_settings\n{\n  \"index\": {\n    \"refresh_interval\": \"30s\",\n    \"translog.durability\": \"async\",\n    \"translog.sync_interval\": \"10s\",\n    \"merge.scheduler.max_thread_count\": \"4\",\n    \"merge.policy.max_merge_at_once\": \"32\",\n    \"merge.policy.segments_per_tier\": \"32\",\n    \"merge.policy.max_merged_segment\": \"5gb\"\n  }\n}",
    "verification": "Check merge statistics via `GET /_cat/nodes?v&h=name,indexing.index_total,merge.current,merge.total_time` during peak bulk loads. Ensure indexing throughput remains stable with zero thread pool rejections (429 HTTP codes).",
    "date": "2026-08-06",
    "id": 1786004198,
    "type": "error"
});