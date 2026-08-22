window.onPostDataLoaded({
    "title": "Fix Elasticsearch Fielddata Circuit Breaker Errors",
    "slug": "fix-elasticsearch-fielddata-circuit-breaker-jvm",
    "language": "Java",
    "code": "CircuitBreakingException",
    "tags": [
        "Elasticsearch",
        "Java",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch clusters experience severe instability and query rejections when the fielddata circuit breaker trips (e.g., <code>[parent] Data too large, data for [...] would be [...]</code>). This occurs when aggregations or sorting operations run on unindexed or dynamic <code>text</code> fields.</p><p>Unlike keyword fields which leverage disk-backed columnar <code>doc_values</code>, text fields require Elasticsearch to load the entire inverted index dictionary into JVM heap memory as in-memory fielddata structures. Because fielddata memory is expensive to build and non-evictable until garbage collected, it rapidly consumes the heap, tripping circuit breakers and causing JVM OutOfMemory crashes.</p>",
    "root_cause": "Aggregating or sorting on analyzed text fields instead of keyword fields, forcing unconstrained in-memory fielddata loading into JVM heap space.",
    "bad_code": "// Inefficient search query aggregating on raw text field\n{\n  \"aggs\": {\n    \"top_categories\": {\n      \"terms\": {\n        \"field\": \"category_name\" // 'category_name' mapped as 'text' without doc_values\n      }\n    }\n  }\n}\n\n// Triggering elasticsearch.yml setting attempt (anti-pattern: increasing limit masks problem)\n// indices.breaker.fielddata.limit: 80%",
    "solution_desc": "Update mappings to use multi-field `keyword` sub-fields (which use off-heap `doc_values`) for all aggregations and sort keys. Clear the fielddata cache, and maintain fielddata limits at safe defaults (typically 40% with circuit breaker at 70%).",
    "good_code": "// 1. Proper Index Mapping using doc_values backed keyword\nPUT /ecommerce_products\n{\n  \"mappings\": {\n    \"properties\": {\n      \"category_name\": {\n        \"type\": \"text\",\n        \"fields\": {\n          \"keyword\": {\n            \"type\": \"keyword\",\n            \"ignore_above\": 256\n          }\n        }\n      }\n    }\n  }\n}\n\n// 2. Query targeting the keyword sub-field\nPOST /ecommerce_products/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"top_categories\": {\n      \"terms\": {\n        \"field\": \"category_name.keyword\"\n      }\n    }\n  }\n}",
    "verification": "Execute `GET /_nodes/stats/indices/fielddata,breaker` to verify `fielddata.memory_size_in_bytes` is near 0 MB and the `tripped` counter on `parent` and `fielddata` breakers ceases to increase.",
    "date": "2026-08-22",
    "id": 1787379794,
    "type": "error"
});