window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound Failures",
    "slug": "postgresql-transaction-id-wraparound-vacuum",
    "language": "PostgreSQL",
    "code": "TXID Wraparound",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) space, meaning it can track up to 4.2 billion transactions. To prevent transaction ID wraparound (where past transactions suddenly appear in the future), Postgres uses <code>VACUUM</code> to 'freeze' old transaction IDs. If autovacuum fails to keep pace due to strict locks, long-running queries, or abandoned replication slots, the oldest transaction age will approach 2 billion. Once it hits the critical threshold, PostgreSQL halts writes and goes into single-user recovery mode to prevent catastrophic data loss.</p>",
    "root_cause": "Long-lived transactions, prepared transactions (2PC), or inactive replication slots hold back the global database 'xmin' horizon, preventing autovacuum from freezing dead tuples and advancing the relfrozenxid limit.",
    "bad_code": "-- BAD PRACTICE: Default conservative PostgreSQL autovacuum settings and unmonitored locks\nALTER SYSTEM SET autovacuum_max_workers = 3;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; -- Only vacuum when 20% of rows change\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;  -- Highly throttled, sleep-heavy vacuuming\nSELECT pg_reload_conf();\n\n-- Running a transaction and leaving it open indefinitely (simulated blocking behavior):\nBEGIN;\nSELECT * FROM sensitive_orders WHERE status = 'PENDING' FOR UPDATE;\n-- Transaction never gets a COMMIT or ROLLBACK, blocking vacuum on this table forever.",
    "solution_desc": "Tune autovacuum configuration to be more aggressive, identify and terminate stale transactions, purge abandoned replication slots, and manually trigger an intensive database-wide freeze. Lowering the autovacuum scale factor and increasing cost limits prevents the vacuum process from sleeping unnecessarily.",
    "good_code": "-- 1. Tune autovacuum to run aggressively and execute faster\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05; -- Trigger at 5% change\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;   -- Increase throughput, reduce sleep duration\nSELECT pg_reload_conf();\n\n-- 2. Identify and terminate active backends older than 4 hours\nSELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE state != 'idle'\n  AND xact_start < now() - interval '4 hours';\n\n-- 3. Drop unconsumed, inactive physical/logical replication slots\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false;\n\n-- 4. Manually force-freeze the critical database tables\nVACUUM FREEZE ANALYZE sensitive_orders;",
    "verification": "Execute the query `SELECT datname, age(datfrozenxid) FROM pg_database;`. Verify that the age of all databases is well below `200,000,000` (typically scaled down to under a few million after a successful aggressive freeze-vacuum execution).",
    "date": "2026-07-03",
    "id": 1783059831,
    "type": "error"
});