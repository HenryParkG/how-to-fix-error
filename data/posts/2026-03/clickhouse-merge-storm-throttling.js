window.onPostDataLoaded({
    "title": "Resolving ClickHouse Part Merge Storms",
    "slug": "clickhouse-merge-storm-throttling",
    "language": "SQL",
    "code": "TooManyParts-41",
    "tags": [
        "SQL",
        "Infra",
        "ClickHouse",
        "Error Fix"
    ],
    "analysis": "<p>ClickHouse utilizes a MergeTree engine where data is written as 'parts' and merged in the background. When an application performs too many small inserts, the number of parts grows faster than the background merger can combine them. This triggers 'Background Write Throttling', where ClickHouse intentionally slows down INSERTs to allow the merger to catch up.</p><p>A 'Merge Storm' occurs when the system attempts to merge a massive number of small parts simultaneously, saturating I/O and CPU, which further delays the processing of new data and can eventually lead to the 'Too many parts' error (code 41).</p>",
    "root_cause": "Inserting data in small batches rather than bulk inserts, exceeding the default 'parts_to_throw_insert' limit (usually 300).",
    "bad_code": "-- High frequency, small volume inserts (Anti-pattern)\nINSERT INTO sensor_data (id, value) VALUES (1, 0.5);\nINSERT INTO sensor_data (id, value) VALUES (2, 0.9);\n-- (Repeated thousands of times per second)",
    "solution_desc": "Implement client-side buffering to ensure inserts are performed in batches of at least 1,000 to 10,000 rows. Alternatively, use an asynchronous insert buffer or adjust the MergeTree settings to handle smaller merges more aggressively at the cost of I/O.",
    "good_code": "-- Use Buffer Engine or Batch Inserts\nINSERT INTO sensor_data (id, value) VALUES (1, 0.5), (2, 0.9), ... (9998 more rows);\n\n-- Adjusting table settings if batching isn't enough\nALTER TABLE sensor_data MODIFY SETTING \n  parts_to_delay_insert = 150,\n  parts_to_throw_insert = 500,\n  max_delay_to_insert_sec = 2;",
    "verification": "Query 'system.parts' and 'system.merges' tables to monitor the active part count and merge progress. Ensure 'active_parts' stays well below the threshold.",
    "date": "2026-03-04",
    "id": 1772586811,
    "type": "error"
});