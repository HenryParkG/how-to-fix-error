window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Fielddata Bloat and Aggregations",
    "slug": "fix-elasticsearch-fielddata-bloat-aggregation-oom",
    "language": "Elasticsearch",
    "code": "CircuitBreakingException",
    "tags": [
        "Docker",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When executing complex aggregations, sorting, or scripting on high-cardinality `text` fields, Elasticsearch is forced to load the entire inverted index for that field into JVM Heap memory as fielddata. Unlike standard term querying, which relies on disk-based index lookups, aggregations require rapid document-to-term lookups. If fielddata is enabled for unoptimized text fields, memory utilization spikes instantaneously, tripping the `parent` or `fielddata` circuit breakers and throwing `CircuitBreakingException` errors.</p><p>By default, fielddata loading is disabled on text fields for this exact reason. Forcing it dynamically is highly anti-pattern and risks bringing down Elasticsearch cluster nodes due to garbage collection loops and eventual Out of Memory states.</p>",
    "root_cause": "Using 'text' fields for terms aggregations forces Elasticsearch to build an in-memory uninverted index (fielddata) on the fly, which is highly memory-inefficient compared to disk-based 'doc_values' built for 'keyword' fields.",
    "bad_code": "// Mapping that allows fielddata loading on analyzed text\nPUT /ecommerce_logs\n{\n  \"mappings\": {\n    \"properties\": {\n      \"user_agent\": {\n        \"type\": \"text\",\n        \"fielddata\": true\n      }\n    }\n  }\n}\n\n// A high-cardinality terms aggregation that quickly exhausts the fielddata circuit breaker\nGET /ecommerce_logs/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"frequent_users\": {\n      \"terms\": {\n        \"field\": \"user_agent\"\n      }\n    }\n  }\n}",
    "solution_desc": "Refactor the index mapping to utilize multi-fields. Map the field primarily as `text` for search queries, and add a `.keyword` sub-field of type `keyword`. Keyword fields utilize `doc_values`\u2014an on-disk, column-oriented data structure written at index time that handles aggregations with minimal heap footprint, bypassing the fielddata allocator altogether.",
    "good_code": "// Correct mapping utilizing multi-fields with doc_values active by default on keyword\nPUT /ecommerce_logs_v2\n{\n  \"mappings\": {\n    \"properties\": {\n      \"user_agent\": {\n        \"type\": \"text\",\n        \"fields\": {\n          \"keyword\": {\n            \"type\": \"keyword\",\n            \"ignore_above\": 256\n          }\n        }\n      }\n    }\n  }\n}\n\n// Execute the terms aggregation against the optimized .keyword sub-field\nGET /ecommerce_logs_v2/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"frequent_users\": {\n      \"terms\": {\n        \"field\": \"user_agent.keyword\",\n        \"size\": 10\n      }\n    }\n  }\n}",
    "verification": "Check current fielddata memory consumption using `GET _nodes/stats/indices/fielddata?fields=user_agent.keyword`. Verify that executing your new aggregation yields zero additional memory footprint in the fielddata stats.",
    "date": "2026-05-30",
    "id": 1780106965,
    "type": "error"
});