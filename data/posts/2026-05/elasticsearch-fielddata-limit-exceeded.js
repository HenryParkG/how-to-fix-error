window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Fielddata LimitExceededException",
    "slug": "elasticsearch-fielddata-limit-exceeded",
    "language": "Elasticsearch DSL / JVM",
    "code": "LimitExceededException",
    "tags": [
        "Docker",
        "Elasticsearch",
        "JVM",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch utilizes Fielddata to load text fields dynamically into JVM heap memory when performing sorting, aggregations, or scripting operations. Unlike standard analyzed fields that map tokens on-disk, fielddata builds an in-memory terms dictionary. When high-cardinality analyzed fields are target queries, fielddata consumption can rapidly swell, causing Elasticsearch's built-in circuit breaker to trigger a <code>LimitExceededException</code> to prevent an imminent JVM Out-of-Memory (OOM) crash.</p>",
    "root_cause": "The root cause is attempting sorting, aggregations, or parent-child script lookups on fields mapped as analyzed `text` without utilizing doc_values. Because standard analyzed `text` fields do not support doc_values, Elasticsearch fallback loads all terms dynamically into heap memory via the fielddata cache.",
    "bad_code": "PUT /user_logs\n{\n  \"mappings\": {\n    \"properties\": {\n      \"user_id\": {\n        \"type\": \"text\" \n      },\n      \"action_message\": {\n        \"type\": \"text\"\n      }\n    }\n  }\n}\n\n-- BUG: Executing aggregation on raw text field triggers fielddata bloat\nGET /user_logs/_search\n{\n  \"aggs\": {\n    \"popular_users\": {\n      \"terms\": {\n        \"field\": \"user_id\"\n      }\n    }\n  }\n}",
    "solution_desc": "To fix this, map the fields as `keyword` type instead of `text`, or define a multi-field mapping containing a `.keyword` sub-field. Keyword fields utilize on-disk columnar `doc_values` which do not consume JVM heap, avoiding circuit breaker triggers. If dynamic fielddata is strictly required on text, enable fielddata limits in Elasticsearch configuration settings.",
    "good_code": "PUT /user_logs\n{\n  \"mappings\": {\n    \"properties\": {\n      \"user_id\": {\n        \"type\": \"text\",\n        \"fields\": {\n          \"keyword\": {\n            \"type\": \"keyword\",\n            \"ignore_above\": 256\n          }\n        }\n      },\n      \"action_message\": {\n        \"type\": \"text\"\n      }\n    }\n  }\n}\n\n-- FIX: Query aggregation utilizing the on-disk doc_values via the .keyword subfield\nGET /user_logs/_search\n{\n  \"size\": 0,\n  \"aggs\": {\n    \"popular_users\": {\n      \"terms\": {\n        \"field\": \"user_id.keyword\"\n      }\n    }\n  }\n}",
    "verification": "Execute the updated aggregation query against your indexes. Run `GET _nodes/stats/breaker` to verify the `fielddata` circuit breaker usage remains close to 0 bytes. Clear any residual heap allocations using `POST /user_logs/_cache/clear?fielddata=true` and confirm no further `LimitExceededException` errors occur.",
    "date": "2026-05-21",
    "id": 1779365293,
    "type": "error"
});