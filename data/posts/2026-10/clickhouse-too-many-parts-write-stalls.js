window.onPostDataLoaded({
    "title": "Mitigate ClickHouse Too Many Parts Write Stalls",
    "slug": "clickhouse-too-many-parts-write-stalls",
    "language": "ClickHouse / SQL",
    "code": "TOO_MANY_PARTS",
    "tags": [
        "ClickHouse",
        "SQL",
        "Database",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>ClickHouse utilizes a Log-Structured Merge (LSM) variant within its <code>MergeTree</code> engine family. Every <code>INSERT</code> statement generates an immutable compressed directory known as a 'part'. A background merge thread asynchronously coalesces smaller parts into larger, sorted parts to maintain query latency and optimize file system layout.</p><p>When an ingestion pipeline sends high-frequency micro-batches (e.g., hundreds or thousands of writes per second with few rows each), parts are committed faster than background merges can consolidate them. Once the number of inactive/unmerged parts in a single partition reaches <code>parts_to_delay_insert</code> (default: 150), ClickHouse throttles writes by injecting synthetic sleep intervals. If the count reaches <code>parts_to_throw_insert</code> (default: 300), ClickHouse abruptly rejects inserts with <code>DB::Exception: Too many parts in all data parts in table (N). Merges are processing significantly slower than inserts</code>.</p>",
    "root_cause": "Ingestion pattern creating excessive small data parts per second, outpacing MergeTree background merge capabilities due to sub-optimal client micro-batching and overly granular partition keys.",
    "bad_code": "-- Sub-optimal schema: Over-partitioned by day and hour\nCREATE TABLE default.telemetry_events (\n    event_time DateTime,\n    device_id UUID,\n    payload String\n)\nENGINE = MergeTree()\nPARTITION BY (toYYYYMMDD(event_time), toHour(event_time)) -- Creates 24 partitions per day\nORDER BY (device_id, event_time);\n\n-- Ingestion application issuing high-frequency single-row/micro-inserts:\n-- INSERT INTO telemetry_events VALUES (now(), generateUUIDv4(), '{\"cpu\": 42}');\n-- Executed 500 times/second -> creates 500 distinct parts/sec, triggering error 252.",
    "solution_desc": "Architect a dual-layer mitigation: 1) Coarsen table partitioning (e.g., monthly `toYYYYMM()` or daily `toYYYYMMDD()`) to prevent fragmenting writes across excessive active partition directories; 2) Implement asynchronous client-side or server-side buffering via `async_insert = 1` and `wait_for_async_insert = 1` to combine micro-inserts into robust batches before committing parts.",
    "good_code": "-- Coarsened partitioning scheme\nCREATE TABLE default.telemetry_events (\n    event_time DateTime,\n    device_id UUID,\n    payload String\n)\nENGINE = MergeTree()\nPARTITION BY toYYYYMM(event_time) -- Limit active partitions\nORDER BY (device_id, event_time)\nSETTINGS \n    parts_to_delay_insert = 300,\n    parts_to_throw_insert = 600,\n    max_bytes_to_merge_at_max_space_overhead = 10737418240;\n\n-- Enable Native Server-Side Asynchronous Inserts for incoming connections\nSET async_insert = 1;\nSET wait_for_async_insert = 1;\nSET async_insert_threads = 4;\nSET async_insert_max_data_size = 10485760; -- 10MB batch buffer\nSET async_insert_busy_timeout_ms = 1000;    -- Flush after 1 second max",
    "verification": "Monitor parts count using `SELECT table, count() FROM system.parts WHERE active GROUP BY table;` during peak ingestion. Confirm via `system.part_log` that merge operations keep the active part count comfortably under `parts_to_delay_insert` without write latency spikes.",
    "date": "2026-10-18",
    "id": 1792308850,
    "type": "error"
});