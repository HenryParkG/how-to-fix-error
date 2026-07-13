window.onPostDataLoaded({
    "title": "Preventing PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-xid-wraparound-prevention",
    "language": "SQL",
    "code": "FATAL: database is not accepting commands",
    "tags": [
        "PostgreSQL",
        "Database",
        "Infra",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on Multiversion Concurrency Control (MVCC) to manage concurrent transactions. MVCC implements a 32-bit transaction identifier (XID). When the XID counter approaches 2^31 (approximately 2 billion) transactions, PostgreSQL must wrap around to 3. If old tables have not been fully processed by the 'vacuum' system to freeze older XIDs, active transactions run the risk of mistaking past transactions for future ones, causing catastrophic data corruption. To prevent this, PostgreSQL enforces a hard block on write operations with a fatal database shutdown state once the safety threshold is breached.</p>",
    "root_cause": "The primary root cause is an autovacuum daemon that cannot keep up with high write volumes due to throttled I/O configurations, coupled with long-running active transactions, abandoned replication slots, or uncommitted 2-phase transactions that hold back the oldest transaction ID (xmin horizon).",
    "bad_code": "-- Sub-optimal postgresql.conf settings that trigger wraparound under heavy write workloads\n-- Throttles autovacuum too harshly, delaying necessary freeze cycles\nALTER SYSTEM SET autovacuum_max_workers = 3;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.20;\n\n-- Typical application query bug: Long-running idle transaction\nBEGIN;\nSELECT * FROM billing_events WHERE status = 'pending' FOR UPDATE;\n-- Application leaves connection open indefinitely without executing COMMIT or ROLLBACK;",
    "solution_desc": "Architectural prevention requires adjusting the PostgreSQL autovacuum daemon configurations to be highly aggressive, actively monitoring the maximum transaction age across all tables, and immediately terminating dangling backend transactions or abandoned replication slots that block xmin progression.",
    "good_code": "-- 1. Tune Autovacuum to be highly aggressive under heavy write loads\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000; -- Scale limits to bypass CPU throttling\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05; -- Trigger vacuum at 5% modification rate\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000; -- Set freeze threshold early\n\n-- 2. Query to pinpoint transactions blocking the freeze boundary\nSELECT pid, age(backend_xmin), query, state, usename, query_start \nFROM pg_stat_activity \nWHERE backend_xmin IS NOT NULL \nORDER BY age(backend_xmin) DESC \nLIMIT 5;\n\n-- 3. Run targeted manual aggressive vacuum freeze to resolve safety issues\nVACUUM FREEZE ANALYZE VERBOSE public.billing_events;",
    "verification": "Monitor database age continuously by running: `SELECT max(age(datfrozenxid)) FROM pg_database;`. Verify that the oldest transaction age stays stable and trends well below the default autovacuum_freeze_max_age of 200,000,000.",
    "date": "2026-07-13",
    "id": 1783922370,
    "type": "error"
});