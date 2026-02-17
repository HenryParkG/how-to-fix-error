window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Fielddata Circuit Breaker Trips",
    "slug": "elasticsearch-fielddata-breaker-fix",
    "language": "Java",
    "code": "CircuitBreakerException",
    "tags": [
        "Java",
        "Infra",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch uses 'Fielddata' to perform aggregations and sorting on 'text' fields. Unlike 'keyword' fields that use disk-based doc_values, fielddata is loaded into the JVM heap. On large datasets, multiple aggregations can quickly exhaust the heap, triggering the 'Fielddata Circuit Breaker' to prevent an OutOfMemoryError. This leads to 429 errors or failed queries across the cluster.</p>",
    "root_cause": "Performing terms aggregations on 'text' fields instead of 'keyword' fields, forcing ES to load inverted indices into RAM.",
    "bad_code": "PUT /my_index/_mapping\n{\n  \"properties\": {\n    \"category\": {\n      \"type\": \"text\",\n      \"fielddata\": true\n    }\n  }\n}",
    "solution_desc": "Disable fielddata on text fields and use multi-fields to define a 'keyword' sub-field. Keyword fields use doc_values (on-disk columnar storage), which are memory-efficient and do not rely on the fielddata circuit breaker.",
    "good_code": "PUT /my_index/_mapping\n{\n  \"properties\": {\n    \"category\": {\n      \"type\": \"text\",\n      \"fields\": {\n        \"raw\": { \"type\": \"keyword\" }\n      }\n    }\n  }\n}\n// Aggregate on category.raw instead",
    "verification": "Run 'GET /_nodes/stats/breaker' and verify that fielddata 'tripped' counts have stopped incrementing after updating the mapping.",
    "date": "2026-02-17",
    "id": 1771291040,
    "type": "error"
});