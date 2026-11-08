window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL XID Wraparound Lockups",
    "slug": "mitigating-postgresql-xid-wraparound-autovacuum",
    "language": "SQL",
    "code": "XID_WRAPAROUND_FATAL",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction counter providing approximately 4.2 billion distinct transaction IDs (XIDs). It treats XIDs as a circular ring space, where past transactions occupy up to 2 billion previous IDs and future transactions occupy the rest. To maintain visibility, PostgreSQL relies on Autovacuum to freeze old row commit headers before XIDs wrap around. If a database transaction approaches <code>autovacuum_freeze_max_age</code> (typically 200M XIDs), emergency autovacuum workers lock tables. If unaddressed and the system reaches the hard limit of 2 billion transactions, PostgreSQL enters read-only shutdown mode, rejecting all writes with a fatal panic to avoid data loss.</p>",
    "root_cause": "Long-running abandoned transactions, lingering prepared transactions (`PREPARE TRANSACTION`), or overly throttled autovacuum I/O settings prevent `vacuum freeze` from advancing `relfrozenxid` and `datfrozenxid`.",
    "bad_code": "-- Lingering transactions and passive autovacuum throttle default settings:\n-- postgresql.conf\nautovacuum_vacuum_cost_limit = 200     -- Severely throttles autovacuum I/O\nautovacuum_vacuum_cost_delay = 20ms    -- Enforces high delay sleep between page scans\nvacuum_freeze_table_age = 150000000\n\n-- Abandoned application transaction holding XID horizon open indefinitely\nBEGIN;\nSELECT * FROM billing_records WHERE status = 'PENDING' FOR UPDATE;\n-- Application hangs or drops socket without ROLLBACK/COMMIT;",
    "solution_desc": "Terminate blocking transactions holding back the global XID horizon, inspect and remove orphaned prepared transactions, increase autovacuum throughput by tuning cost limits and worker memory, and execute manual non-blocking freeze operations on priority tables.",
    "good_code": "-- 1. Identify transactions blocking the frozen XID horizon\nSELECT pid, now() - xact_start AS duration, state, query \nFROM pg_stat_activity \nWHERE backend_xid IS NOT NULL \nORDER BY age(backend_xid) DESC LIMIT 5;\n\n-- 2. Drop abandoned prepared transactions\nSELECT gid, prepared, owner, database FROM pg_prepared_xacts;\n-- ROLLBACK PREPARED '<gid>';\n\n-- 3. Tune autovacuum settings dynamically\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2;\nALTER SYSTEM SET maintenance_work_mem = '2GB';\nSELECT pg_reload_conf();\n\n-- 4. Execute aggressive manual freeze on aging tables\nVACUUM (FREEZE, VERBOSE, ANALYZE) billing_records;",
    "verification": "Execute `SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;` to ensure all database XID ages remain well below 50,000,000 and the autovacuum freeze emergency horizon is cleared.",
    "date": "2026-11-08",
    "id": 1794108545,
    "type": "error"
});