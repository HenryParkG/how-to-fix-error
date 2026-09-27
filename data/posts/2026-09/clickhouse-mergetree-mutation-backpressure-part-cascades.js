window.onPostDataLoaded({
    "title": "Resolving ClickHouse Mutation Backpressure and Part Cascades",
    "slug": "clickhouse-mergetree-mutation-backpressure-part-cascades",
    "language": "SQL",
    "code": "TOO_MANY_PARTS",
    "tags": [
        "SQL",
        "Infra",
        "ClickHouse",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>ClickHouse utilizes a log-structured MergeTree storage model where writes continuously assemble new immutable parts that merge asynchronously in background threads. However, running repeated asynchronous <code>ALTER TABLE ... UPDATE/DELETE</code> mutations causes a major amplification problem. Mutations in ClickHouse are not in-place modifications; they duplicate and rewrite whole data parts with an incremented mutation version.</p><p>When frequent mutations coincide with a steady stream of micro-batch inserts, the mutation queue explodes. The background merge scheduler prioritizes mutation merges over general hygiene merges, which starves base level merges and triggers <code>DB::Exception: Too many parts in all data parts in table (N > 300)</code>. This causes catastrophic insert backpressure and rejected operations.</p>",
    "root_cause": "Issuing high-frequency transactional UPDATE/DELETE mutations instead of batched mutations or deduplicating engines, exhausting the background pool and exceeding max_parts_in_total thresholds.",
    "bad_code": "-- Running frequent row-level mutations causes severe part amplification\nALTER TABLE metrics_data \nUPDATE metric_value = 104.2 \nWHERE host = 'srv-01' AND timestamp = 1711900000;\n\nALTER TABLE metrics_data \nUPDATE metric_value = 105.1 \nWHERE host = 'srv-01' AND timestamp = 1711900010;\n\n-- Results in: DB::Exception: Too many parts in all data parts in table (301 > 300).\n-- Merges and mutations backpressure, halting incoming streaming inserts.",
    "solution_desc": "Transition mutable operations to CollapsingMergeTree or ReplacingMergeTree engines with an is_deleted flag or version column, replacing explicit mutations with append-only inserts. For necessary batch updates, coalesce them into scheduled offline batches and increase the concurrent mutation and merge execution capacity.",
    "good_code": "-- 1. Migrate table to ReplacingMergeTree to handle upserts without mutations\nCREATE TABLE metrics_data_v2 (\n    host LowCardinality(String),\n    timestamp DateTime,\n    metric_value Float64,\n    version UInt64,\n    is_deleted UInt8\n)\nENGINE = ReplacingMergeTree(version, is_deleted)\nPARTITION BY toYYYYMM(timestamp)\nORDER BY (host, timestamp);\n\n-- 2. Instead of ALTER UPDATE, perform append-only inserts with higher version\nINSERT INTO metrics_data_v2 VALUES ('srv-01', '2024-03-31 12:00:00', 104.2, 2, 0);\n\n-- 3. Query final deduplicated view with FINAL modifier or argMax aggregations\nSELECT host, timestamp, metric_value \nFROM metrics_data_v2 FINAL \nWHERE is_deleted = 0;",
    "verification": "Query `system.mutations` to verify that `is_done = 1` across all tasks and monitor `system.parts` to ensure active part counts per partition stay reliably below 50 without triggering insertion backpressure warnings.",
    "date": "2026-09-27",
    "id": 1790476461,
    "type": "error"
});