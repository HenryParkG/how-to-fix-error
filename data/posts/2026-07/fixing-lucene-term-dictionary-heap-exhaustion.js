window.onPostDataLoaded({
    "title": "Fixing Lucene Term Dictionary Heap Exhaustion in ES",
    "slug": "fixing-lucene-term-dictionary-heap-exhaustion",
    "language": "Java / Elasticsearch",
    "code": "OutOfMemoryError",
    "tags": [
        "Elasticsearch",
        "Lucene",
        "JVM",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch clusters utilizing unmapped dynamic schemas frequently experience unexpected JVM heap exhaustion. When dynamic mapping (`dynamic: true`) is active on high-cardinality JSON payload streams, Elasticsearch dynamically generates tens of thousands of unique field names. Each distinct field generates dedicated Lucene Finite State Transducers (FSTs) in the Term Dictionary that are permanently loaded into off-heap and JVM heap memory, causing catastrophic `java.lang.OutOfMemoryError: Java heap space` crashes.</p>",
    "root_cause": "Unrestricted JSON ingestion creates dynamic schema explosion. Lucene loads field index FST data structures directly into memory upon segment creation, scaling exponentially with the number of unique dynamic field keys.",
    "bad_code": "// Buggy Elasticsearch mapping allowing unlimited dynamic fields\nPUT /telemetry_logs\n{\n  \"mappings\": {\n    \"dynamic\": true\n  }\n}",
    "solution_desc": "Enforce strict mapping rules or use the `flattened` field type for unpredictable, high-cardinality JSON keys. Set explicit maximum field boundaries using `index.mapping.total_fields.limit` to prevent schema explosion from causing memory exhaustion.",
    "good_code": "// Fixed: Strict mapping limits with flattened type support\nPUT /telemetry_logs\n{\n  \"settings\": {\n    \"index.mapping.total_fields.limit\": 1000\n  },\n  \"mappings\": {\n    \"dynamic\": \"strict\",\n    \"properties\": {\n      \"timestamp\": { \"type\": \"date\" },\n      \"service_name\": { \"type\": \"keyword\" },\n      \"metadata\": {\n        \"type\": \"flattened\"\n      }\n    }\n  }\n}",
    "verification": "Verify current field memory footprint via standard API calls: `GET /telemetry_logs/_stats/fielddata,segments`. Check that field counts stay within threshold limits and cluster memory remains stable under dynamic payload pressure.",
    "date": "2026-07-30",
    "id": 1785398892,
    "type": "error"
});