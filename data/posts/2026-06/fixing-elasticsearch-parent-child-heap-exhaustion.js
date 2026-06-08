window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Parent-Child Heap Exhaustion",
    "slug": "fixing-elasticsearch-parent-child-heap-exhaustion",
    "language": "Java",
    "code": "OutOfMemoryError (Heap Exhaustion)",
    "tags": [
        "Java",
        "Elasticsearch",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch parent-child relationships (implemented via the <code>join</code> field type) store association maps in global ordinals. Global ordinals build a dynamic in-memory lookup map of terms to resolve parent-child associations. Under intensive concurrent search workloads coupled with background segment merges, memory usage can spike dramatically.</p><p>When a background merge finishes, Elasticsearch rebuilds global ordinals. If queries are actively running against those parent-child associations, the JVM heap quickly becomes saturated with uncollected old-generation arrays, causing Node JVM OutOfMemoryErrors.</p>",
    "root_cause": "Global ordinals for join fields are computed lazily during the first search query after a segment merge. If multiple complex 'has_child' or 'has_parent' queries occur simultaneously, multiple threads attempt to build and access un-cached global ordinals, overwhelming the heap memory and bypassing the circuit breaker checks.",
    "bad_code": "PUT /company_index\n{\n  \"mappings\": {\n    \"properties\": {\n      \"my_join_field\": {\n        \"type\": \"join\",\n        \"relations\": {\n          \"company\": \"employee\"\n        }\n      }\n    }\n  }\n}\n\n// BAD: Querying parent-child relations dynamically without optimizing mapping loading properties.\n// Under active segment merges, this query forces on-demand computation of massive arrays.",
    "solution_desc": "Configure the join field mapping to load global ordinals eagerly (`eager_global_ordinals` set to `true`). This shifts the construction overhead from query-time to index-time (specifically during segment merges), preventing heap spikes during query processing. Additionally, decrease the parent/child cache threshold and tune the fielddata circuit breaker limits.",
    "good_code": "PUT /company_index_optimized\n{\n  \"settings\": {\n    \"index.queries.cache.enabled\": true\n  },\n  \"mappings\": {\n    \"properties\": {\n      \"my_join_field\": {\n        \"type\": \"join\",\n        \"relations\": {\n          \"company\": \"employee\"\n        },\n        \"eager_global_ordinals\": true\n      }\n    }\n  }\n}\n\n// Configuration adjustment to Elasticsearch Node custom settings (elasticsearch.yml):\n// indices.breaker.fielddata.limit: \"40%\"\n// indices.fielddata.cache.size: \"20%\"",
    "verification": "Perform index updates while running continuous bulk parent-child indexing operations. Execute concurrent queries and verify via `GET /company_index_optimized/_stats/fielddata` that global ordinals RAM consumption is stabilized and does not trigger garbage collection threshold warnings.",
    "date": "2026-06-08",
    "id": 1780886567,
    "type": "error"
});