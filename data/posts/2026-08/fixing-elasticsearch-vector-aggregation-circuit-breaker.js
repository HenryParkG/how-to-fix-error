window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Vector Aggregation Circuit Breakers",
    "slug": "fixing-elasticsearch-vector-aggregation-circuit-breaker",
    "language": "Java",
    "code": "CIRCUIT_BREAKER_OPEN",
    "tags": [
        "Java",
        "Elasticsearch",
        "SQL",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Executing aggregations or sorting queries on dense vector fields without proper field mapping or doc_values configuration forces Elasticsearch to uncompress and load all high-dimensional vectors into JVM parent fielddata circuit breaker memory. This causes immediate <code>CircuitBreakingException</code> errors, tripping the <code>parent</code> or <code>fielddata</code> breaker and dropping concurrent cluster requests.</p>",
    "root_cause": "Querying or aggregating on dense_vector fields that default to unmapped dynamic properties or lack proper indexing parameters (index: true) forces Lucene heap-based unmapped field parsing, blowing past indices.breaker.fielddata.limit (default 40% JVM heap).",
    "bad_code": "PUT /doc-index\n{\n  \"mappings\": {\n    \"properties\": {\n      \"embedding\": {\n        \"type\": \"dense_vector\",\n        \"dims\": 1536\n      }\n    }\n  }\n}\n\nPOST /doc-index/_search\n{\n  \"aggs\": {\n    \"vector_terms\": {\n      \"terms\": {\n        \"field\": \"embedding\"\n      }\n    }\n  }\n}",
    "solution_desc": "Vector fields cannot be aggregated directly as term values. Enable HNSW indexing with HNSW parameter optimization, restrict vector search queries to knn query blocks, and use synthetic metadata sub-fields (e.g., keyword fields) for aggregations while adjusting breaker limits if needed.",
    "good_code": "PUT /doc-index-fixed\n{\n  \"mappings\": {\n    \"properties\": {\n      \"embedding\": {\n        \"type\": \"dense_vector\",\n        \"dims\": 1536,\n        \"index\": true,\n        \"similarity\": \"cosine\",\n        \"index_options\": { \"type\": \"hnsw\" }\n      },\n      \"category\": { \"type\": \"keyword\" }\n    }\n  }\n}\n\nPOST /doc-index-fixed/_search\n{\n  \"knn\": {\n    \"field\": \"embedding\",\n    \"query_vector\": [0.01, 0.02, 0.03],\n    \"k\": 10,\n    \"num_candidates\": 100\n  },\n  \"aggs\": {\n    \"category_agg\": {\n      \"terms\": { \"field\": \"category\" }\n    }\n  }\n}",
    "verification": "Execute the query payload and check GET /_nodes/stats/breaker to confirm fielddata memory usage remains under 5%. Ensure no CircuitBreakingException logs occur during high throughput.",
    "date": "2026-08-02",
    "id": 1785666408,
    "type": "error"
});