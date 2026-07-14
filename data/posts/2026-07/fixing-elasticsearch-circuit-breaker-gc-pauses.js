window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Circuit Breaker & GC Pauses",
    "slug": "fixing-elasticsearch-circuit-breaker-gc-pauses",
    "language": "Java / Elasticsearch",
    "code": "CircuitBreakingException",
    "tags": [
        "Java",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When executing complex aggregations on high-cardinality fields (like UUIDs, transaction keys, or IP addresses), Elasticsearch builds in-memory Lucene structures called global ordinals. High-cardinality values force the cluster to allocate massive memory buckets on the JVM heap. Under heavy querying, this triggers the Parent Circuit Breaker (<code>CircuitBreakingException: [parent] Data too large</code>) to protect the node from crashing. If the circuit breaker is near its limits, JVM spends all its CPU cycles running Stop-the-World garbage collection pauses, causing nodes to drop out of the cluster, API latency spikes, and eventual cluster instability.</p>",
    "root_cause": "Querying high-cardinality fields with deep aggregations without using fielddata optimization or pagination strategies, causing heap consumption to hit the default 95% Parent Circuit Breaker limit.",
    "bad_code": "GET /api_logs/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"high_cardinality_ips\": {\n      \"terms\": {\n        \"field\": \"client_ip.keyword\",\n        \"size\": 50000\n      }\n    }\n  }\n}",
    "solution_desc": "Switch to composite aggregations with paging using the `after` parameter to split the work and reduce memory footprint. Optimize mapping by configuring `eager_global_ordinals` on high-cardinality fields so memory structures are built during index indexing, not search execution, and configure appropriate circuit breaker limits.",
    "good_code": "PUT /api_logs/_mapping\n{\n  \"properties\": {\n    \"client_ip\": {\n      \"type\": \"keyword\",\n      \"eager_global_ordinals\": true\n    }\n  }\n}\n\n// Paginate using Composite Aggregation instead of requesting massive bucket lists at once\nGET /api_logs/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"paginated_ips\": {\n      \"composite\": {\n        \"size\": 1000,\n        \"sources\": [\n          {\n            \"ip\": {\n              \"terms\": {\n                \"field\": \"client_ip\"\n              }\n            }\n          }\n        ]\n      }\n    }\n  }\n}",
    "verification": "Execute the query using an aggressive parallel script. Query the Elasticsearch Node Stats API (<code>GET _nodes/stats/breaker</code>) and verify that the request memory usage stays below the Parent Circuit Breaker threshold without triggering garbage collection pauses.",
    "date": "2026-07-14",
    "id": 1784025076,
    "type": "error"
});