window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Fielddata Cache Blowups during Aggregations",
    "slug": "fixing-elasticsearch-fielddata-cache-blowups",
    "language": "Elasticsearch",
    "code": "OutOfMemoryError",
    "tags": [
        "Docker",
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When executing complex, nested aggregations or sorting operations on <code>text</code> fields, Elasticsearch loads the field's inverted index into JVM memory as 'Fielddata'. Unlike <code>doc_values</code>, which are disk-based and highly optimized, Fielddata is built on-the-fly and lives entirely on the heap. When nested aggregations force high-cardinality analysis across millions of documents, Fielddata can rapidly consume the remaining JVM heap, bypassing circuit breakers and resulting in an OutOfMemoryError (OOM) that crashes the entire node.</p>",
    "root_cause": "The root cause is aggregating or sorting on analyze-enabled 'text' fields instead of using 'keyword' fields. This forces Elasticsearch to construct on-the-heap Fielddata caches instead of leveraging disk-backed doc values.",
    "bad_code": "{\n  \"mappings\": {\n    \"properties\": {\n      \"user_bio\": {\n        \"type\": \"text\",\n        \"fielddata\": true \n      }\n    }\n  }\n}\n// Aggregation query causing OOM:\n// GET /users/_search\n// {\n//   \"aggs\": {\n//     \"bios\": {\n//       \"terms\": { \"field\": \"user_bio\" }\n//     }\n//   }\n// }",
    "solution_desc": "Configure the index mapping using multi-fields. Map text fields with a sub-field of type 'keyword'. The 'keyword' type utilizes doc_values by default, storing aggregation data on disk outside the JVM heap. For existing indices, update mappings and run '_reindex' to transition aggregations away from fielddata.",
    "good_code": "{\n  \"mappings\": {\n    \"properties\": {\n      \"user_bio\": {\n        \"type\": \"text\",\n        \"fields\": {\n          \"keyword\": {\n            \"type\": \"keyword\",\n            \"ignore_above\": 256\n          }\n        }\n      }\n    }\n  }\n}\n// Optimized Aggregation Query:\n// GET /users/_search\n// {\n//   \"aggs\": {\n//     \"bios\": {\n//       \"terms\": { \"field\": \"user_bio.keyword\" }\n//     }\n//   }\n// }",
    "verification": "Execute the nested aggregation query and verify the node statistics. Run 'GET /_nodes/stats/indices/fielddata?fields=user_bio' and confirm that 'memory_size_in_bytes' is 0, indicating that Elasticsearch is resolving the aggregations entirely via doc_values without utilizing heap-based Fielddata caches.",
    "date": "2026-05-26",
    "id": 1779761676,
    "type": "error"
});