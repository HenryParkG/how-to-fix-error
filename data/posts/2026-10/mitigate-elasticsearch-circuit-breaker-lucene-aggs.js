window.onPostDataLoaded({
    "title": "Mitigate Elasticsearch Breaker Trips on Lucene Aggs",
    "slug": "mitigate-elasticsearch-circuit-breaker-lucene-aggs",
    "language": "Java",
    "code": "CircuitBreakingException",
    "tags": [
        "Java",
        "Elasticsearch",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch employs circuit breakers to prevent nodes from running out of JVM heap memory. When running deep or high-cardinality aggregation queries, the parent circuit breaker (<code>[parent] Data too large, data for [<transport_request>] would be larger than limit</code>) trips if the total heap consumption across all caches, in-flight requests, and aggregation buckets exceeds the configured threshold (default 95% of heap when <code>indices.breaker.total.use_real_memory</code> is enabled).</p><p>During Lucene term aggregations on high-cardinality fields, Elasticsearch constructs global ordinals and loads bucket collectors into memory. Unbounded sub-aggregations on unpruned shards lead to massive heap allocation spikes, tripping the breaker and causing subsequent queries on the cluster to fail immediately.</p>",
    "root_cause": "High-cardinality terms aggregations loaded simultaneously across wide time ranges cause Lucene global ordinals building and nested bucket map allocations to exceed available JVM heap limits.",
    "bad_code": "GET /metrics-logs/_search\n{\n  \"size\": 0,\n  \"query\": { \"match_all\": {} },\n  \"aggs\": {\n    \"user_tracking\": {\n      \"terms\": {\n        \"field\": \"user_uuid.keyword\",\n        \"size\": 1000000\n      },\n      \"aggs\": {\n        \"sessions\": {\n          \"terms\": {\n            \"field\": \"session_id.keyword\",\n            \"size\": 100\n          }\n        }\n      }\n    }\n  }\n}",
    "solution_desc": "Replace raw deep terms aggregations with the Composite aggregation pattern for paginated bucket evaluation. Explicitly bound the search range with time-based filters, use `execution_hint: map` for low-frequency multi-shard terms, and configure global ordinal eager loading on mapping creation.",
    "good_code": "GET /metrics-logs/_search\n{\n  \"size\": 0,\n  \"query\": {\n    \"range\": {\n      \"@timestamp\": {\n        \"gte\": \"now-1h\"\n      }\n    }\n  },\n  \"aggs\": {\n    \"paged_users\": {\n      \"composite\": {\n        \"size\": 1000,\n        \"sources\": [\n          { \"user\": { \"terms\": { \"field\": \"user_uuid.keyword\" } } },\n          { \"session\": { \"terms\": { \"field\": \"session_id.keyword\" } } }\n        ]\n      }\n    }\n  }\n}",
    "verification": "Query Elasticsearch indices stats via `GET _nodes/stats/breaker` before and after running batch aggregation workloads. Verify that `tripped` counters remain zero and parent breaker overhead remains consistently below 70% of heap.",
    "date": "2026-10-25",
    "id": 1792894932,
    "type": "error"
});