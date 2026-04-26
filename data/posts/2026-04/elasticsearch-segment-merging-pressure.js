window.onPostDataLoaded({
    "title": "Fixing ES Segment Merging Pressure in High-Cardinality Indices",
    "slug": "elasticsearch-segment-merging-pressure",
    "language": "Go",
    "code": "IOPerformance",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>High-cardinality indices in Elasticsearch create massive Lucene segments. When indexing rates are high, the background merge process cannot keep up with the creation of new segments. This leads to 'merging pressure', causing high CPU usage, increased disk I/O, and eventually throttling of incoming indexing requests.</p>",
    "root_cause": "Frequent index refreshes (default 1s) creating too many small segments, combined with high-cardinality fields that make merging computationally expensive and I/O intensive.",
    "bad_code": "PUT /logs-index/_settings\n{\n  \"index\": {\n    \"refresh_interval\": \"1s\",\n    \"number_of_replicas\": 1\n  }\n}",
    "solution_desc": "Increase the refresh_interval to allow larger segments to form in memory before flushing to disk. Tune the merge policy to limit the number of simultaneous merges to prevent I/O saturation, and use 'async' durability for translogs if data loss risk is acceptable.",
    "good_code": "PUT /logs-index/_settings\n{\n  \"index\": {\n    \"refresh_interval\": \"60s\",\n    \"merge.policy.max_merged_segment\": \"5gb\",\n    \"merge.scheduler.max_thread_count\": 1,\n    \"translog.durability\": \"async\"\n  }\n}",
    "verification": "Check `GET _nodes/stats/indices/merges` to ensure the `total_throttled_time_in_millis` is not increasing and the segment count remains stable.",
    "date": "2026-04-26",
    "id": 1777168257,
    "type": "error"
});