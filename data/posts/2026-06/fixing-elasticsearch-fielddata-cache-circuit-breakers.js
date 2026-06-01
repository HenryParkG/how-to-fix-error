window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Fielddata Cache Circuit Breakers",
    "slug": "fixing-elasticsearch-fielddata-cache-circuit-breakers",
    "language": "Java",
    "code": "CircuitBreakingException: [fielddata]",
    "tags": [
        "Java",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch circuit breakers act as internal watchdogs to prevent nodes from running out of JVM memory. When executing searches with sorting, parent-child joins, or aggregations on high-cardinality `text` fields, Elasticsearch must build an in-memory structure called fielddata. Unlike regular index fields, which leverage disk-based doc_values, analyzed `text` fields cannot use doc_values. Consequently, they load massive amounts of data directly into the JVM heap. When this fielddata heap usage exceeds the configured threshold (typically 40% of the heap by default, managed by `indices.breaker.fielddata.limit`), the fielddata circuit breaker triggers, failing subsequent search requests with a <code>CircuitBreakingException</code> to prevent an OutOfMemoryError.</p>",
    "root_cause": "Aggregations or sorting queries are executed against analyzed 'text' fields instead of 'keyword' fields, forcing Elasticsearch to construct heavy in-memory fielddata caches that exhaust the JVM heap.",
    "bad_code": "PUT /customer_logs\n{\n  \"mappings\": {\n    \"properties\": {\n      \"user_id\": {\n        \"type\": \"text\"\n      }\n    }\n  }\n}\n\n# Aggregation query that triggers fielddata bloat\nGET /customer_logs/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"frequent_users\": {\n      \"terms\": {\n        \"field\": \"user_id\",\n        \"size\": 10\n      }\n    }\n  }\n}",
    "solution_desc": "The correct architectural solution is to avoid executing aggregations and sorting directly on analyzed `text` fields. Instead, map the fields using the `keyword` type (which uses disk-based doc_values by default) or use a multi-field mapping containing both a `text` version for search and a `.keyword` sub-field for aggregations. If mapping changes cannot be deployed immediately, configure the fielddata cache limit or clear the cache using the cluster APIs.",
    "good_code": "PUT /customer_logs\n{\n  \"mappings\": {\n    \"properties\": {\n      \"user_id\": {\n        \"type\": \"text\",\n        \"fields\": {\n          \"keyword\": {\n            \"type\": \"keyword\",\n            \"ignore_above\": 256\n          }\n        }\n      }\n    }\n  }\n}\n\n# Aggregation query targeting the keyword subfield leveraging doc_values on disk\nGET /customer_logs/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"frequent_users\": {\n      \"terms\": {\n        \"field\": \"user_id.keyword\",\n        \"size\": 10\n      }\n    }\n  }\n}",
    "verification": "Run the optimization query and inspect current fielddata cache size via the Nodes Stats API: `GET /_nodes/stats/indices/fielddata?fields=*`. The fielddata memory usage should read 0 bytes, indicating that aggregations are successfully routing through disk-based doc_values instead of the JVM heap.",
    "date": "2026-06-01",
    "id": 1780281998,
    "type": "error"
});