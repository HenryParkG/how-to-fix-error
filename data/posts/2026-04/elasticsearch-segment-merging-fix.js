window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Segment Merging Bottlenecks",
    "slug": "elasticsearch-segment-merging-fix",
    "language": "Java",
    "code": "ThreadStarvation",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch indexing performance often degrades during high-ingest periods due to segment merging bottlenecks. When Lucene creates too many small segments, the background merge process consumes significant I/O and CPU. If the merge rate cannot keep up, Elasticsearch throttles incoming write requests.</p><p>This leads to 'Write-Thread Starvation,' where the indexing threads are put into a wait state, causing 429 Too Many Requests errors or massive latency spikes in the ingestion pipeline, even if CPU utilization isn't at 100%.</p>",
    "root_cause": "Default merge scheduler settings limit concurrent merges too aggressively for SSD-backed high-throughput clusters, causing the index-throttle to engage.",
    "bad_code": "PUT /my-index/_settings\n{\n  \"index.merge.scheduler.max_thread_count\": 1,\n  \"index.refresh_interval\": \"1s\"\n}",
    "solution_desc": "Increase the `max_thread_count` for SSD environments and adjust the `index.refresh_interval` to create larger initial segments. Also, tune the `TieredMergePolicy` to allow more segments per tier to reduce the frequency of merges.",
    "good_code": "PUT /my-index/_settings\n{\n  \"index.refresh_interval\": \"30s\",\n  \"index.merge.scheduler.max_thread_count\": 4,\n  \"index.merge.policy.segments_per_tier\": 20,\n  \"index.merge.policy.max_merged_segment\": \"5gb\"\n}",
    "verification": "Check `GET _nodes/stats/indices/merges` to ensure 'total_throttled_time_in_millis' is no longer increasing under load.",
    "date": "2026-04-21",
    "id": 1776756174,
    "type": "error"
});