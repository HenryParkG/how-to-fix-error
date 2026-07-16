window.onPostDataLoaded({
    "title": "Fixing ES Circuit Breakers & Lucene Heap Exhaustion",
    "slug": "fixing-elasticsearch-circuit-breakers-lucene-heap-exhaustion",
    "language": "Java",
    "code": "CircuitBreakingException",
    "tags": [
        "Java",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Elasticsearch executes indexing-heavy workloads, Lucene constantly writes segment files to disk. Over time, these small segments must be merged into larger ones via background Lucene threads to maintain search performance. However, if the merge rate or concurrent merges are unthrottled, or if the indices have hundreds of small fields, segment merges require high on-heap buffers for storing term dictionaries, doc values, and points. This sudden demand triggers Elasticsearch's parent circuit breaker (<code>CircuitBreakingException</code>) or leads to native OutOfMemory (OOM) errors and GC pauses that destabilize the cluster.</p>",
    "root_cause": "The root cause is a misconfiguration of Lucene's TieredMergePolicy and concurrent merge schedulers on highly segmented indices. When too many concurrent merges execute on nodes with low heap overhead or high indexing rate, the Lucene SegmentMerger allocates massive off-heap/on-heap arrays to merge terms. If the parent circuit breaker `indices.breaker.total.use_real_memory` is set to true, it aggressively terminates the thread when real memory exceeds the default 95% threshold.",
    "bad_code": "PUT /_cluster/settings\n{\n  \"persistent\": {\n    \"indices.breaker.total.limit\": \"95%\",\n    \"indices.breaker.total.use_real_memory\": true\n  }\n}\n\n// Bad Index Settings (Unrestricted concurrent merges on spin-disks/unbalanced nodes)\nPUT /my-heavy-index/_settings\n{\n  \"index\": {\n    \"refresh_interval\": \"1s\",\n    \"merge\": {\n      \"scheduler\": {\n        \"max_thread_count\": \"8\" \n      },\n      \"policy\": {\n        \"max_merged_segment\": \"100gb\",\n        \"segments_per_tier\": \"2\"\n      }\n    }\n  }\n}",
    "solution_desc": "Throttle the merge scheduler to safe limits to reduce concurrent heap allocation, set explicit index buffer sizes, and tune Lucene's `TieredMergePolicy`. Reducing `max_thread_count` limits concurrent merge overhead. Increasing the index write buffer (`indices.memory.index_buffer_size`) prevents the creation of small segments in the first place, resolving the underlying issue.",
    "good_code": "PUT /_cluster/settings\n{\n  \"persistent\": {\n    \"indices.breaker.total.use_real_memory\": true,\n    \"indices.breaker.total.limit\": \"85%\",\n    \"indices.memory.index_buffer_size\": \"20%\"\n  }\n}\n\n// Optimized Index Settings\nPUT /my-heavy-index/_settings\n{\n  \"index\": {\n    \"refresh_interval\": \"30s\",\n    \"merge\": {\n      \"scheduler\": {\n        \"max_thread_count\": \"1\",\n        \"max_merge_count\": \"6\"\n      },\n      \"policy\": {\n        \"max_merged_segment\": \"5gb\",\n        \"segments_per_tier\": \"12\",\n        \"max_merge_at_once\": \"10\"\n      }\n    }\n  }\n}",
    "verification": "Monitor merge activity and memory usage during heavy indexing runs using the Node Stats API: `GET _nodes/stats/indices/merges,breaker`. Confirm that the `merges.current_size_in_bytes` is bounded, the Parent Breaker tripped count remains at 0, and JVM Garbage Collection allocation rates stabilize.",
    "date": "2026-07-16",
    "id": 1784199012,
    "type": "error"
});