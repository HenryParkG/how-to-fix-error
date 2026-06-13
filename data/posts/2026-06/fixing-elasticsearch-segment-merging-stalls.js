window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Segment Merging Stalls",
    "slug": "fixing-elasticsearch-segment-merging-stalls",
    "language": "Java",
    "code": "WriteAmplification",
    "tags": [
        "Java",
        "Elasticsearch",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When ingestion rates spike on dynamic Elasticsearch clusters, Lucene must rapidly write new, immutable index segments to disk. Under heavy default workloads, a rapid influx of tiny segments triggers non-stop background merging processes. If physical I/O speeds or thread pools cannot keep up with this background merge rate, Elasticsearch triggers protective indexing throttles. This results in devastating segment merging stalls, severe write amplification, and massive spikes in ingestion latency that can bring production logging pipelines to their knees.</p>",
    "root_cause": "The cluster is using highly frequent refresh intervals (e.g., 1s), which forces the creation of hundreds of tiny physical disk segments. This overwhelms the default tier-merging configuration, leading to I/O exhaustion and forced index throttling.",
    "bad_code": "PUT /telemetry_logs\n{\n  \"settings\": {\n    \"index\": {\n      \"refresh_interval\": \"1s\",\n      \"number_of_shards\": 1,\n      \"number_of_replicas\": 1\n    }\n  }\n}",
    "solution_desc": "Optimize the Lucene segment lifecycle for bulk ingest by delaying segment creations and tuning the tier merge threshold limits. Increase the `refresh_interval` from 1s to 30s or greater to allow index buffers to fill up properly before committing to disk. Configure dynamic translog settings to commit asynchronously, and tune merge-policy parameters (`index.merge.policy.max_merged_segment` and `segments_per_tier`) to balance background merges and prevent extreme write amplification.",
    "good_code": "PUT /telemetry_logs_optimized\n{\n  \"settings\": {\n    \"index\": {\n      \"refresh_interval\": \"60s\",\n      \"number_of_shards\": 3,\n      \"number_of_replicas\": 1,\n      \"translog\": {\n        \"durability\": \"async\",\n        \"sync_interval\": \"15s\",\n        \"flush_threshold_size\": \"1gb\"\n      },\n      \"merge\": {\n        \"policy\": {\n          \"max_merged_segment\": \"5gb\",\n          \"segments_per_tier\": \"24\",\n          \"max_merge_at_once\": \"24\"\n        }\n      }\n    }\n  }\n}",
    "verification": "Monitor cluster health during ingestion tests using the Elasticsearch API: `GET _nodes/stats/indices/segments`. Confirm that the segment count growth curves stabilize cleanly and the dynamic `index_writer` throttle metrics drop back down to zero milliseconds.",
    "date": "2026-06-13",
    "id": 1781333455,
    "type": "error"
});