window.onPostDataLoaded({
    "title": "Mitigating ClickHouse MergeTree Part Bloat in Upserts",
    "slug": "clickhouse-mergetree-part-bloat",
    "language": "SQL",
    "code": "TooManyParts",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>ClickHouse is designed for high-speed analytical inserts, but high-frequency upserts in <code>ReplacingMergeTree</code> engines can lead to 'Part Bloat'. Every INSERT creates a new data part. If the background merge process cannot keep up with the rate of small insertions, the part count grows exponentially, eventually hitting the <code>parts_to_throw_insert</code> limit and blocking all writes.</p><p>This is particularly common in streaming workloads where individual events are upserted as they arrive.</p>",
    "root_cause": "High-frequency, low-volume INSERT statements creating more data parts per second than the background merge threads can combine.",
    "bad_code": "-- Application pseudo-code making frequent small inserts\nINSERT INTO my_table (id, version, data) VALUES (1, 123, 'info');\n-- (1 second later)\nINSERT INTO my_table (id, version, data) VALUES (1, 124, 'updated_info');",
    "solution_desc": "Implement a buffering layer. Instead of direct inserts, use a <code>Buffer</code> engine table or an external queue (like Kafka) to batch records. Increase the <code>max_insert_block_size</code> and tune the <code>merge_with_ttl_timeout</code> to encourage more aggressive merging.",
    "good_code": "-- 1. Create the destination ReplacingMergeTree\nCREATE TABLE target_table (id UInt64, version UInt64, data String)\nENGINE = ReplacingMergeTree(version) ORDER BY id;\n\n-- 2. Create a Buffer table to collect data in memory\nCREATE TABLE target_table_buffer AS target_table\nENGINE = Buffer(currentDatabase(), 'target_table', 16, 10, 60, 10000, 100000, 1000000, 10000000);\n\n-- 3. Application inserts into the BUFFER table instead\nINSERT INTO target_table_buffer (id, version, data) VALUES (...);",
    "verification": "Query 'system.parts' to monitor the 'active' part count. It should remain stable even under high write load.",
    "date": "2026-02-21",
    "id": 1771636334,
    "type": "error"
});