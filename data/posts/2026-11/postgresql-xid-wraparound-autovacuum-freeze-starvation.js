window.onPostDataLoaded({
    "title": "PostgreSQL XID Wraparound & Freeze Starvation",
    "slug": "postgresql-xid-wraparound-autovacuum-freeze-starvation",
    "language": "PostgreSQL",
    "code": "ERR_XID_WRAPAROUND",
    "tags": [
        "PostgreSQL",
        "Database",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on 32-bit transaction IDs (XIDs), creating a finite capacity of approximately 4.29 billion transactions. Using modular comparison logic, past transactions are visible within a ~2 billion transaction horizon, while future transactions lie outside it. To prevent older transactions from appearing to be in the future (wraparound failure), PostgreSQL requires periodic freezing of old row headers (<code>t_infomask</code> set to <code>HEAP_XMIN_FROZEN</code>) via the <code>VACUUM</code> engine.</p><p>Freeze starvation occurs when high-throughput write workloads push the database age past <code>autovacuum_freeze_max_age</code> while concurrent long-running transactions, lock contention (e.g., <code>AccessExclusiveLock</code> from migrations), or aggressive vacuum cost limits prevent the autovacuum worker from completing freeze operations on tables. Once the remaining safe transaction threshold reaches critical levels, PostgreSQL abruptly enters emergency single-user read-only mode to prevent catastrophic data corruption, dropping all client connections.</p>",
    "root_cause": "Long-running analytical queries, uncommitted transaction sessions holding locks, and under-tuned autovacuum cost throttle parameters (cost limit/cost delay) starve vacuum workers from completing freeze sweeps before datfrozenxid advances beyond the autovacuum_freeze_max_age ceiling.",
    "bad_code": "-- Default restrictive autovacuum configuration in postgresql.conf\nautovacuum_cost_limit = 200\nautovacuum_cost_delay = 20ms\nautovacuum_freeze_max_age = 200000000\n\n-- Application leak: Long-running idle-in-transaction holding snapshot\nBEGIN;\nSELECT * FROM billing_events WHERE status = 'PENDING' FOR UPDATE;\n-- Session left open indefinitely by orphaned connection pool worker\n-- Blocks vacuum from advancing OldestXmin across the database cluster",
    "solution_desc": "Mitigate freeze starvation by tuning autovacuum throttle parameters so workers can process high-write tables faster than XID consumption rates. Enforce idle session timeouts to prevent snapshot pinning, and implement aggressive table-level freeze settings on high-churn relations.",
    "good_code": "-- 1. Tune global engine throughput in postgresql.conf\nautovacuum_cost_limit = 5000\nautovacuum_cost_delay = 2ms\nidle_in_transaction_session_timeout = '60s'\nstatement_timeout = '300s'\n\n-- 2. Target high-churn tables with aggressive freeze settings\nALTER TABLE billing_events SET (\n    autovacuum_vacuum_cost_delay = 0,\n    autovacuum_freeze_min_age = 10000000,\n    autovacuum_freeze_table_age = 50000000\n);\n\n-- 3. Emergency vacuum when nearing wraparound horizon\nVACUUM FREEZE VERBOSE ANALYZE billing_events;",
    "verification": "Query pg_database to ensure transactions are safely below the wraparound limit: SELECT datname, age(datfrozenxid), 2^31 - age(datfrozenxid) AS xids_until_wraparound FROM pg_database ORDER BY age(datfrozenxid) DESC;",
    "date": "2026-11-14",
    "id": 1794629635,
    "type": "error"
});