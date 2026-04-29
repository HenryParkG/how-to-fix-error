window.onPostDataLoaded({
    "title": "Mitigating Segment Merging Throttling in ES Clusters",
    "slug": "elasticsearch-segment-merging-throttling",
    "language": "Java",
    "code": "ES_MERGE_THROTTLE",
    "tags": [
        "Java",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy Elasticsearch clusters, Lucene's background segment merging often struggles to keep up with the rate of new segment creation. When the number of segments exceeds a threshold, Elasticsearch throttles indexing requests to 20MB/s by default to prevent the node from crashing, causing massive spikes in ingestion latency.</p>",
    "root_cause": "The default concurrent merge scheduler settings are too conservative for NVMe-based storage, leading to an 'indexing buffer' backup.",
    "bad_code": "PUT /my-index/_settings\n{\n  \"index.refresh_interval\": \"1s\"\n  // Default merge settings active\n}",
    "solution_desc": "Increase the refresh interval to reduce segment creation frequency and tune the concurrent merge scheduler to utilize more threads and allow higher IOPS if the hardware supports it.",
    "good_code": "PUT /my-index/_settings\n{\n  \"index.refresh_interval\": \"30s\",\n  \"index.merge.scheduler.max_thread_count\": 4,\n  \"index.merge.policy.max_merged_segment\": \"5gb\"\n}",
    "verification": "Monitor the 'indices.store.throttle.total_time_in_millis' metric in the Nodes Stats API. It should stabilize at or near zero after tuning.",
    "date": "2026-04-29",
    "id": 1777449684,
    "type": "error"
});