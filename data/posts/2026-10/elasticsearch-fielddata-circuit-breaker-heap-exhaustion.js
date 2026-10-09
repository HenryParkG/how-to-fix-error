window.onPostDataLoaded({
    "title": "Resolving Elasticsearch Fielddata Heap Circuit Breakers",
    "slug": "elasticsearch-fielddata-circuit-breaker-heap-exhaustion",
    "language": "Java",
    "code": "CircuitBreakingException",
    "tags": [
        "Java",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch utilizes circuit breakers to prevent JVM OutOfMemoryError (OOM) crashes by estimating memory requirements before executing queries. When aggregations, sorting, or scripting are executed against analyzed <code>text</code> fields, Elasticsearch must build in-memory data structures known as <code>fielddata</code> to map terms back to documents.</p><p>Unlike disk-backed <code>doc_values</code> (used for <code>keyword</code> fields), <code>fielddata</code> is loaded directly into the JVM heap and remains resident for the lifecycle of the index reader. Under concurrent queries on high-cardinality text fields, fielddata consumption rapidly spikes past <code>indices.breaker.fielddata.limit</code> (default 40% of heap), triggering cascading <code>CircuitBreakingException: [parent] Data too large</code> across cluster nodes and rejecting client operations.</p>",
    "root_cause": "Aggregations performed on high-cardinality analyzed 'text' fields force the node to construct un-inverted fielddata structures directly in JVM heap memory instead of using off-heap columnar doc_values.",
    "bad_code": "PUT /telemetry_events\n{\n  \"mappings\": {\n    \"properties\": {\n      \"trace_payload\": {\n        \"type\": \"text\",\n        \"fielddata\": true\n      }\n    }\n  }\n}\n\nPOST /telemetry_events/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"top_traces\": {\n      \"terms\": {\n        \"field\": \"trace_payload\",\n        \"size\": 1000\n      }\n    }\n  }\n}",
    "solution_desc": "Refactor mappings to use multi-fields: preserve `text` for full-text search, and append a `keyword` sub-field for aggregations. `keyword` fields use disk-backed `doc_values` which are handled via the OS filesystem page cache rather than JVM heap memory. Also, configure `indices.breaker.fielddata.limit` defensively.",
    "good_code": "PUT /telemetry_events\n{\n  \"mappings\": {\n    \"properties\": {\n      \"trace_payload\": {\n        \"type\": \"text\",\n        \"fields\": {\n          \"keyword\": {\n            \"type\": \"keyword\",\n            \"ignore_above\": 256,\n            \"doc_values\": true\n          }\n        }\n      }\n    }\n  }\n}\n\nPOST /telemetry_events/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"top_traces\": {\n      \"terms\": {\n        \"field\": \"trace_payload.keyword\",\n        \"size\": 1000,\n        \"execution_hint\": \"map\"\n      }\n    }\n  }\n}",
    "verification": "Query `GET /_nodes/stats/indices/fielddata` to confirm fielddata memory usage drops to 0 bytes. Monitor `GET /_nodes/stats/breaker` to verify circuit breaker trip counts remain static under high aggregation loads.",
    "date": "2026-10-09",
    "id": 1791548547,
    "type": "error"
});