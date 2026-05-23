window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Heap OOM on Segment Merges",
    "slug": "elasticsearch-jvm-heap-oom-lucene-merges",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Infra",
        "Elasticsearch",
        "Error Fix"
    ],
    "analysis": "<p>When write-heavy workloads flood Elasticsearch with continuous bulk indexing operations, the engine creates numerous small, independent Lucene segments. To keep segment counts manageable, the Lucene background merge process (governed by TieredMergePolicy) runs concurrently to merge these small segments into larger ones. If disk write I/O is slow or indexing rates vastly outpace merge capabilities, the merge queue grows infinitely. Because open Lucene segments hold reader metadata directly inside the JVM heap, an excessive accumulation of unmerged segments balloons JVM heap usage, triggering severe garbage collection pauses and eventually causing a fatal OutOfMemoryError (OOM).</p>",
    "root_cause": "The mismatch between rapid indexing rates and slow disk write I/O speeds causes unmerged Lucene segment metadata to pile up in the JVM heap, eventually exhausting the allocated heap space.",
    "bad_code": "PUT /my-heavy-index\n{\n  \"settings\": {\n    \"index.refresh_interval\": \"1s\",\n    \"index.merge.policy.max_merge_at_once\": 100,\n    \"index.merge.policy.segments_per_tier\": 100,\n    \"index.requests.cache.enable\": true\n  }\n}",
    "solution_desc": "Mitigate the heap overhead by optimizing index write settings. Increase the refresh interval to create larger initial segments, throttle merge configurations to match physical disk limits, reduce maximum concurrent merge thread limits to prevent CPU/IO starvation, and configure parent circuit breakers to proactively block indexing before OOM strikes.",
    "good_code": "PUT /my-heavy-index\n{\n  \"settings\": {\n    \"index.refresh_interval\": \"30s\",\n    \"index.merge.policy.max_merge_at_once\": 10,\n    \"index.merge.policy.segments_per_tier\": 10,\n    \"index.merge.scheduler.max_thread_count\": 1,\n    \"indices.breaker.fielddata.limit\": \"40%\",\n    \"indices.breaker.request.limit\": \"30%\"\n  }\n}",
    "verification": "Monitor segment consolidation using 'GET /_cat/segments?v'. Track heap trends using 'GET /_nodes/stats/jvm' during heavy indexing loads to verify that segment count remains stable and heap utilization stays within safe bounds.",
    "date": "2026-05-23",
    "id": 1779524474,
    "type": "error"
});