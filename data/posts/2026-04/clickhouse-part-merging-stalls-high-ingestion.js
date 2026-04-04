window.onPostDataLoaded({
    "title": "Resolving ClickHouse Part Merging Stalls",
    "slug": "clickhouse-part-merging-stalls-high-ingestion",
    "language": "SQL",
    "code": "Too many parts (425)",
    "tags": [
        "SQL",
        "Infra",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>ClickHouse relies on a background process to merge small data 'parts' into larger ones for optimal query performance. In high-ingestion time-series scenarios, if data is inserted in too many small batches or if the partitioning key is too granular (e.g., partitioning by second rather than day), the number of active parts explodes. When the part count exceeds the internal threshold (usually 300 per partition), ClickHouse intentionally slows down or stops inserts (stalling) to allow the background merge process to catch up, causing massive ingestion latency.</p>",
    "root_cause": "Highly granular partitioning keys and frequent small inserts exceeding the background merge rate.",
    "bad_code": "CREATE TABLE telemetry (\n    ts DateTime,\n    device_id UInt64,\n    val Float32\n) ENGINE = MergeTree()\n-- BAD: Partitioning by second creates too many parts\nPARTITION BY toYYYYMMDDhhmmss(ts)\nORDER BY (device_id, ts);",
    "solution_desc": "Coarsen the partitioning key to reduce the total number of parts per table and implement a Buffer engine or client-side batching to ensure inserts contain at least 10,000+ rows.",
    "good_code": "CREATE TABLE telemetry (\n    ts DateTime,\n    device_id UInt64,\n    val Float32\n) ENGINE = MergeTree()\n-- GOOD: Partitioning by month or day\nPARTITION BY toYYYYMM(ts)\nORDER BY (device_id, ts);\n\n-- Recommended: Use a Buffer table for small frequent writes\nCREATE TABLE telemetry_buffer AS telemetry \nENGINE = Buffer(current_database(), telemetry, 16, 10, 100, 10000, 1000000, 10000000);",
    "verification": "Query 'system.parts' to monitor 'active' parts per partition; ensure the count remains well below the 'parts_to_throw_insert' threshold.",
    "date": "2026-04-04",
    "id": 1775277988,
    "type": "error"
});