window.onPostDataLoaded({
    "title": "Mapping Explosion: Preventing Elasticsearch Index Bloat",
    "slug": "elasticsearch-mapping-explosion-prevention",
    "language": "Elasticsearch / Lucene",
    "code": "LimitExceededException",
    "tags": [
        "Elasticsearch",
        "Performance",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>In Elasticsearch, every unique field in an index is tracked in the cluster state. When dynamic mapping is enabled (the default), sending a document with thousands of unique keys results in a 'Mapping Explosion'. This is particularly dangerous when using data structures like maps with arbitrary keys (e.g., user IDs or UUIDs as field names).</p><p>As the number of fields grows, the cluster state size increases significantly. Since the cluster state must be replicated to every node and processed by the Master node, a large mapping causes massive heap pressure, increased garbage collection latency, and can eventually lead to a 'Master Not Discovered' or OOM (Out Of Memory) exception, effectively toppling the entire cluster.</p><p>Furthermore, each field added to the mapping consumes memory in the Field Data Cache and increases the complexity of the Lucene segments, degrading search performance even for unrelated queries.</p>",
    "root_cause": "Unconstrained dynamic mapping of high-cardinality keys where arbitrary data is used as field names instead of values.",
    "bad_code": "PUT /logs-index/_doc/1\n{\n  \"timestamp\": \"2023-10-27T10:00:00Z\",\n  \"metadata\": {\n    \"user_8231\": \"logged_in\",\n    \"user_9921\": \"action_buy\",\n    \"temp_key_a82f\": 102\n  }\n}",
    "solution_desc": "Disable dynamic mapping by setting 'dynamic' to 'strict' or 'runtime' at the index level. For data with arbitrary keys, use a 'flattened' field type or a 'nested' object with standardized 'key' and 'value' fields to keep the mapping count static.",
    "good_code": "PUT /logs-index\n{\n  \"mappings\": {\n    \"dynamic\": \"strict\",\n    \"properties\": {\n      \"timestamp\": { \"type\": \"date\" },\n      \"metadata\": {\n        \"type\": \"flattened\"\n      },\n      \"attributes\": {\n        \"type\": \"nested\",\n        \"properties\": {\n          \"key\": { \"type\": \"keyword\" },\n          \"value\": { \"type\": \"keyword\" }\n        }\n      }\n    }\n  },\n  \"settings\": {\n    \"index.mapping.total_fields.limit\": 1000\n  }\n}",
    "verification": "Attempt to index a document with an undefined field; the request should fail with a 400 Bad Request error. Monitor the 'index.mapping.total_fields.limit' setting to ensure it is enforced.",
    "date": "2026-02-11",
    "id": 1770803230,
    "type": "error"
});