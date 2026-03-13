window.onPostDataLoaded({
    "title": "Mitigating ClickHouse MergeTree Fragmentation",
    "slug": "clickhouse-mergetree-upsert-fix",
    "language": "SQL",
    "code": "Too Many Parts",
    "tags": [
        "SQL",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>ClickHouse is designed for high-volume appends, but high-frequency upserts using ReplacingMergeTree can lead to the 'Too many parts' error. Every INSERT creates a new data part. When upserting small batches thousands of times per second, ClickHouse's background merge process cannot keep up, resulting in massive fragmentation and severely degraded query performance as the engine must scan thousands of small files.</p>",
    "root_cause": "Inserting data in small, frequent batches into MergeTree engines instead of utilizing ClickHouse's optimized bulk-loading architecture.",
    "bad_code": "-- Frequent small inserts (Bad practice)\nINSERT INTO user_signals (id, status) VALUES (123, 'active');\n-- Repeating this 1000 times per second",
    "solution_desc": "Implement an asynchronous buffer layer. Use the ClickHouse 'Buffer' engine or an application-side buffer (e.g., in Go or Python) to collect records and perform a single large batch insert every few seconds or when a size threshold is met.",
    "good_code": "CREATE TABLE user_signals_buffer AS user_signals\nENGINE = Buffer(db, user_signals, 16, 10, 60, 10000, 100000, 1000000, 10000000);\n-- Now insert into the buffer instead\nINSERT INTO user_signals_buffer (id, status) VALUES (123, 'active');",
    "verification": "Query 'system.parts' table. The 'active' parts count for the table should remain stable and low (typically under 300).",
    "date": "2026-03-13",
    "id": 1773364467,
    "type": "error"
});