window.onPostDataLoaded({
    "title": "Resolve ClickHouse 'Too Many Parts' Write Stalls",
    "slug": "resolve-clickhouse-too-many-parts-stalls",
    "language": "SQL",
    "code": "DB::Exception: Too many parts in all data parts in table",
    "tags": [
        "ClickHouse",
        "Database",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>When streaming events into ClickHouse MergeTree tables at high frequencies, write operations often fail with <code>DB::Exception: Too many parts in all data parts in table (252)</code> or <code>parts_to_delay_insert</code> warnings.</p><p>ClickHouse does not function like a row-oriented transactional database; every <code>INSERT</code> query generates at least one new immutable part on disk. When external producers emit high-throughput single-row inserts or frequent micro-batches (hundreds of inserts per second), the rate of part creation far exceeds the capability of ClickHouse's background merge engine. Once unmerged active parts exceed thresholds, ClickHouse rejects writes to prevent disk metadata exhaustion.</p>",
    "root_cause": "Ingestion clients issue small, sub-second INSERT statements directly into ClickHouse. Each INSERT write operation writes an individual part directory to the filesystem. When the number of active parts in a partition exceeds `parts_to_delay_insert` (default 150) and reaches `parts_to_throw_insert` (default 300), ClickHouse blocks incoming writes to force background merges to catch up.",
    "bad_code": "-- High-frequency anti-pattern: micro-batching directly from application threads\n-- Executed 500 times per second with small payloads\nINSERT INTO telemetry.sensor_readings (timestamp, sensor_id, temperature, humidity)\nVALUES (now(), 402, 21.5, 48.2);",
    "solution_desc": "Batch inserts on the client side (aiming for blocks of 10,000 to 100,000 rows), or enable ClickHouse's native server-side asynchronous inserts (`async_insert = 1` and `wait_for_async_insert = 1`). Additionally, verify that table partitioning keys do not cause over-partitioning (e.g., partition by month/week instead of by hour or high-cardinality IDs).",
    "good_code": "-- 1. Enable asynchronous batching at the user or profile level\nSET async_insert = 1;\nSET wait_for_async_insert = 1;\nSET async_insert_max_data_size = 10485760; -- 10MB buffer\nSET async_insert_busy_timeout_ms = 500;   -- Flush every 500ms max\n\n-- 2. Optimize table partitioning to prevent part fragmentation\nCREATE TABLE telemetry.sensor_readings (\n    timestamp DateTime64(3, 'UTC'),\n    sensor_id UInt32,\n    temperature Float32,\n    humidity Float32\n)\nENGINE = MergeTree()\nPARTITION BY toYYYYMM(timestamp) -- Avoid granular partitioning like toHour\nORDER BY (sensor_id, timestamp)\nSETTINGS parts_to_delay_insert = 300,\n         parts_to_throw_insert = 600,\n         max_delay_to_insert = 2;",
    "verification": "Query system metrics to monitor active part counts and merge performance: `SELECT table, count() as active_parts FROM system.parts WHERE active GROUP BY table;`. Confirm that part counts remain stable (ideally below 50-100 per partition) during peak ingestion.",
    "date": "2026-10-23",
    "id": 1792743238,
    "type": "error"
});