window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Parent Breaker Livelocks",
    "slug": "fixing-elasticsearch-parent-circuit-breaker-livelocks",
    "language": "Java",
    "code": "BreakerLivelock",
    "tags": [
        "Java",
        "Elasticsearch",
        "Docker",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>High-cardinality aggregations (such as nested <code>terms</code> aggregations over raw unindexed fields or dynamically parsed strings) cause memory usage in Elasticsearch node JVMs to skyrocket. When total memory allocation crosses the default parent circuit breaker threshold (<code>indices.breaker.total.use_real_memory: true</code>, set at 95% heap), Elasticsearch interrupts query execution with a <code>CircuitBreakingException</code>. Under high query concurrency, the JVM continuously enters stop-the-world GC cycles attempting to reclaim dynamic bucket allocations while incoming queries continuously re-trigger the breaker, locking the node in a persistent livelock state.</p>",
    "root_cause": "Unbounded memory consumption by high-cardinality terms aggregations pushing heap memory beyond the parent circuit breaker limit, forcing continuous GC pauses without fully releasing query bucket object references fast enough under sustained request volume.",
    "bad_code": "// Buggy Elasticsearch Query requesting unbounded high-cardinality buckets\nPOST /log-events/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"unique_user_sessions\": {\n      \"terms\": {\n        \"field\": \"user_session_id.keyword\", // High cardinality: 50M+ values\n        \"size\": 100000\n      }\n    }\n  }\n}",
    "solution_desc": "Replace standard high-cardinality `terms` aggregations with `composite` aggregations for paginated bucket fetching, lowering individual query heap allocation. Additionally, tune node circuit breaker settings and specify explicit `execution_hint: map` or `collect_mode: breadth_first`.",
    "good_code": "// Fixed Query using Composite Aggregations for memory safety\nPOST /log-events/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"paginated_sessions\": {\n      \"composite\": {\n        \"size\": 1000,\n        \"sources\": [\n          { \"session_id\": { \"terms\": { \"field\": \"user_session_id.keyword\" } } }\n        ]\n      }\n    }\n  }\n}",
    "verification": "Execute paginated composite requests on high-cardinality indices. Monitor cluster health via `GET /_nodes/stats/breaker` to ensure `parent` breaker trips drop to zero and JVM heap utilization remains bounded.",
    "date": "2026-08-12",
    "id": 1786518537,
    "type": "error"
});