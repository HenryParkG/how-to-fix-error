window.onPostDataLoaded({
    "title": "Mitigate PostgreSQL TXID Wraparound Vacuum Starvation",
    "slug": "postgres-txid-wraparound-vacuum-starvation",
    "language": "PostgreSQL",
    "code": "ERRCODE_PROGRAM_LIMIT_EXCEEDED",
    "tags": [
        "PostgreSQL",
        "Database",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on 32-bit transaction identifiers (TXIDs), allowing up to 4.29 billion transactions before IDs roll over. To maintain MVCC visibility, vacuum processes must freeze historical TXIDs before reaching the 2-billion transaction horizon. Under heavy write workloads, TXID consumption can drastically outpace autovacuum workers if vacuuming is throttled or starved by lock contention, long-running transactions, or unoptimized cost limits.</p><p>When the database reaches <code>autovacuum_freeze_max_age</code> (typically 200 million transactions old), PostgreSQL enters aggressive anti-wraparound autovacuum mode. If this fails to keep up and the headroom drops to 1 million transactions, the engine stops accepting new write commands and shuts down into single-user read-only mode to prevent catastrophic data corruption.</p>",
    "root_cause": "Autovacuum workers are throttled by restrictive cost delays, starved by persistent open transactions or long-held table locks, and cannot freeze row transaction IDs faster than the ingestion rate.",
    "bad_code": "-- Default / Anti-pattern configuration causing autovacuum starvation\n-- postgresql.conf\nautovacuum_vacuum_cost_limit = 200          -- Severely throttles vacuum I/O\nautovacuum_vacuum_cost_delay = 20ms         -- High sleep overhead per budget cycle\nautovacuum_max_workers = 3                  -- Too few workers shared across databases\nvacuum_freeze_table_age = 150000000\nautovacuum_freeze_max_age = 200000000\n\n-- Starvation scenario: Long-running idle-in-transaction holding back xmin horizon\nBEGIN;\nSELECT * FROM orders WHERE status = 'PENDING';\n-- Application leaves connection open indefinitely without COMMIT or ROLLBACK",
    "solution_desc": "Architectural remediation requires a multi-tiered approach: 1) Prevent TXID horizon stalling by enforcing `idle_in_transaction_session_timeout` and monitoring stale replication slots; 2) Scale up autovacuum I/O throughput by removing cost delay throttling on modern storage; 3) Set aggressive per-table autovacuum freeze profiles for write-intensive tables.",
    "good_code": "-- Step 1: Mitigate horizon blockers in postgresql.conf\nALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = '2ms';\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_max_workers = 8;\n\n-- Step 2: Target high-churn tables with aggressive vacuum and freeze parameters\nALTER TABLE high_velocity_events SET (\n    autovacuum_vacuum_cost_delay = 0,\n    autovacuum_vacuum_cost_limit = 5000,\n    autovacuum_vacuum_scale_factor = 0.05,\n    autovacuum_freeze_max_age = 100000000,\n    autovacuum_freeze_min_age = 10000000\n);\n\n-- Step 3: Run manual non-blocking free vacuum if near critical threshold\nVACUUM FREEZE ANALYZE high_velocity_events;",
    "verification": "Execute `SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;` to monitor TXID age across all databases. Ensure `age(datfrozenxid)` consistently decreases and stays well below `autovacuum_freeze_max_age`.",
    "date": "2026-10-21",
    "id": 1792592099,
    "type": "error"
});