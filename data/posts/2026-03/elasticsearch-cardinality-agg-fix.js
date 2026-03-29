window.onPostDataLoaded({
    "title": "Resolving Elasticsearch Circuit Breaker Exceptions",
    "slug": "elasticsearch-cardinality-agg-fix",
    "language": "Java",
    "code": "CIRCUIT_BREAKING_EXCEPTION",
    "tags": [
        "Java",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch employs circuit breakers to prevent nodes from crashing due to OutOfMemory (OOM) errors. One of the most common triggers is the Request Circuit Breaker, which monitors memory usage during heavy aggregations. When performing cardinality aggregations on high-cardinality fields (like UUIDs or session IDs), Elasticsearch uses the HyperLogLog++ algorithm.</p><p>While HLL++ is memory-efficient, setting a high 'precision_threshold' across many buckets can quickly consume the available heap space, exceeding the default 70% limit and triggering the breaker.</p>",
    "root_cause": "High 'precision_threshold' settings in nested cardinality aggregations combined with a large number of buckets, leading to excessive memory estimation.",
    "bad_code": "{\n  \"aggs\": {\n    \"users\": {\n      \"cardinality\": {\n        \"field\": \"user_id\",\n        \"precision_threshold\": 40000\n      }\n    }\n  }\n}",
    "solution_desc": "Lower the 'precision_threshold' to trade off some accuracy for memory stability, or use the 'search_after' API to process aggregations in smaller batches.",
    "good_code": "{\n  \"aggs\": {\n    \"users\": {\n      \"cardinality\": {\n        \"field\": \"user_id\",\n        \"precision_threshold\": 1000\n      }\n    }\n  }\n}",
    "verification": "Monitor the '_nodes/stats/breaker' API to ensure 'estimated_size_in_bytes' remains well below 'limit_size_in_bytes'.",
    "date": "2026-03-29",
    "id": 1774767275,
    "type": "error"
});