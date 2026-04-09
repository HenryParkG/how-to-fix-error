window.onPostDataLoaded({
    "title": "Mitigating ES Circuit Breaker Trips during Segment Merges",
    "slug": "elasticsearch-circuit-breaker-lucene-merge",
    "language": "Java",
    "code": "CircuitBreakingException",
    "tags": [
        "Infra",
        "Docker",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch circuit breakers are safety mechanisms that prevent nodes from crashing with OutOfMemory (OOM) errors. During heavy indexing, Lucene frequently merges small segments into larger ones to optimize search. This process requires significant heap memory for buffering and metadata. If the <code>indices.breaker.total.limit</code> is reached, Elasticsearch will reject new requests. High fragmentation or 'elephant' segments often trigger this during peak write loads when the JVM garbage collector cannot keep up with the allocation rate of the merge threads.</p>",
    "root_cause": "The Request Circuit Breaker or Parent Breaker trips because the memory overhead of concurrent Lucene segment merges, combined with active indexing buffers, exceeds the configured percentage of the JVM heap.",
    "bad_code": "# Default aggressive merge settings often trip breakers on small heaps\nPUT /my-index/_settings\n{\n  \"index.merge.policy.max_merged_segment\": \"5gb\",\n  \"index.refresh_interval\": \"1s\"\n}",
    "solution_desc": "Throttle the merge process and increase the refresh interval to reduce the frequency of segment creation. Additionally, tune the circuit breaker constants and consider using the 'Real-Memory Circuit Breaker' available in newer ES versions. Lowering the number of concurrent merges prevents memory spikes.",
    "good_code": "PUT /my-index/_settings\n{\n  \"index.refresh_interval\": \"30s\",\n  \"index.merge.scheduler.max_thread_count\": 1,\n  \"indices.breaker.total.limit\": \"70%\",\n  \"index.merge.policy.segments_per_tier\": 20\n}",
    "verification": "Check the `_nodes/stats/breaker` API to monitor the `tripped` counter and verify that `total_heap_usage` stays below the breaker threshold during peak indexing.",
    "date": "2026-04-09",
    "id": 1775718823,
    "type": "error"
});