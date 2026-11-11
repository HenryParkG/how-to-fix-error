window.onPostDataLoaded({
    "title": "Fixing Postgres TXID Wraparound Vacuum Starvation",
    "slug": "postgresql-txid-wraparound-vacuum-freeze-starvation",
    "language": "SQL",
    "code": "ERRCODE_PROGRAM_LIMIT_EXCEEDED",
    "tags": [
        "PostgreSQL",
        "Database",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction counter allowing up to 4.29 billion transaction IDs (TXIDs). To prevent old transactions from appearing in the future due to modular arithmetic wrap, PostgreSQL treats TXIDs circularly and requires <code>VACUUM FREEZE</code> to replace older TXIDs with the special frozen identifier <code>FrozenTransactionId</code>.</p><p>When <code>autovacuum_freeze_max_age</code> (default 200M transactions) is crossed, PostgreSQL triggers aggressive anti-wraparound autovacuum. If this process is blocked by long-running transactions, orphaned prepared transactions, or abandoned replication slots, the remaining TXID cushion depletes until reaching <code>txid_stop_limit</code>, forcing the database into an emergency read-only shutdown mode (<code>PANIC: database is not accepting commands to avoid wraparound data loss</code>).</p>",
    "root_cause": "Starvation of VACUUM FREEZE worker threads caused by uncommitted two-phase transactions, stalled logical replication slots, or long-lived read transactions pinning the oldestxmin boundary.",
    "bad_code": "-- Identifying the blockage: long-running transaction pinning oldestxmin\nBEGIN;\nSELECT * FROM sensitive_audit_events WHERE processed = false;\n-- Transaction left open indefinitely by faulty application worker pool\n-- Blocks VACUUM from freezing tuples older than this backend's xmin",
    "solution_desc": "Identify and terminate lingering transactions, drop inactive replication slots, resolve orphan two-phase transactions via `pg_prepared_xacts`, and temporarily elevate `vacuum_cost_limit` or execute targeted aggressive single-user manual freeze vacuums.",
    "good_code": "-- 1. Terminate long-running blocker connections\nSELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE backend_xmin IS NOT NULL \n  AND state = 'idle in transaction'\n  AND age(backend_xmin) > 10000000;\n\n-- 2. Drop stale replication slots\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false AND age(xmin) > 10000000;\n\n-- 3. Run aggressive manual vacuum freeze with increased cost budget\nSET maintenance_work_mem = '2GB';\nSET vacuum_cost_limit = 5000;\nVACUUM FREEZE ANALYZE VERBOSE core_work_orders;",
    "verification": "Monitor database transaction age using `SELECT datname, age(datfrozenxid) FROM pg_database;`. Ensure `age(datfrozenxid)` drops significantly below `autovacuum_freeze_max_age` (ideally < 50,000,000).",
    "date": "2026-11-11",
    "id": 1794368967,
    "type": "error"
});