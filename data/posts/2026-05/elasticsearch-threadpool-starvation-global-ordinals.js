window.onPostDataLoaded({
    "title": "Mitigating Elasticsearch Global Ordinals Starvation",
    "slug": "elasticsearch-threadpool-starvation-global-ordinals",
    "language": "Java",
    "code": "ThreadpoolStarvation",
    "tags": [
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch uses global ordinals to perform efficient aggregations on keyword fields. By default, these ordinals are computed lazily during the first search request after a segment refresh. On high-cardinality fields, this computation is CPU-intensive and synchronous. If multiple search requests hit a new segment simultaneously, they all block waiting for the ordinals to be built, quickly exhausting the 'search' threadpool and causing 503 Service Unavailable errors.</p>",
    "root_cause": "Lazy computation of global ordinals on high-cardinality keyword fields during search request execution.",
    "bad_code": "PUT /my-index/_mapping\n{\n  \"properties\": {\n    \"user_id\": {\n      \"type\": \"keyword\" \n      // Defaults to eager_global_ordinals: false\n    }\n  }\n}",
    "solution_desc": "Enable 'eager_global_ordinals' in the field mapping. This shifts the computation cost from search-time to refresh-time, ensuring ordinals are ready before the segment is searchable.",
    "good_code": "PUT /my-index/_mapping\n{\n  \"properties\": {\n    \"user_id\": {\n      \"type\": \"keyword\",\n      \"eager_global_ordinals\": true\n    }\n  }\n}",
    "verification": "Check the 'segments' API: GET /my-index/_segments?verbose=true. Monitor 'fielddata' memory usage and search threadpool queue size during index refreshes.",
    "date": "2026-05-02",
    "id": 1777686864,
    "type": "error"
});