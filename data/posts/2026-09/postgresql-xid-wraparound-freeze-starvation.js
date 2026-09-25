window.onPostDataLoaded({
    "title": "PostgreSQL XID Wraparound & Freeze Starvation",
    "slug": "postgresql-xid-wraparound-freeze-starvation",
    "language": "SQL",
    "code": "ERR_XID_WRAPAROUND",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on 32-bit Transaction IDs (XIDs) with modulo-2^32 arithmetic to provide Multi-Version Concurrency Control (MVCC). In this circular space, any transaction ID within the preceding 2 billion IDs is considered past, while IDs in the following 2 billion are in the future. To prevent older committed rows from appearing as future transactions when the 32-bit counter wraps around, PostgreSQL requires autovacuum to \"freeze\" old row tuples by marking them as universally visible (FrozenTransactionId).</p><p>When write activity is high and autovacuum is starved\u2014due to aggressive cost limits, long-running queries holding snapshot horizons, lock contention, or misconfigured <code>autovacuum_freeze_max_age</code>\u2014the gap between <code>datfrozenxid</code> and the current XID widens. Once the age exceeds <code>autovacuum_freeze_max_age</code> (default 200 million), autovacuum triggers anti-wraparound aggressive vacuuming. If this worker is blocked or cannot keep pace before the 2-billion limit is reached, PostgreSQL forces an emergency read-only shutdown (<code>FATAL: database is not accepting commands to avoid wraparound data loss</code>) to prevent data corruption.</p>",
    "root_cause": "Autovacuum worker starvation caused by restrictive cost throttling parameters (autovacuum_vacuum_cost_limit), long-running read transactions holding old snapshots, or AccessExclusiveLock contention that blocks autovacuum from freezing tuples before age(datfrozenxid) hits the critical fail-safe horizon.",
    "bad_code": "-- Misconfigured postgresql.conf allowing freeze starvation\nautovacuum = on\nautovacuum_max_workers = 3\nautovacuum_vacuum_cost_delay = 20ms       -- Outdated default: overly throttles I/O\nautovacuum_vacuum_cost_limit = 200        -- Too low for modern NVMe storage\nautovacuum_freeze_max_age = 200000000\nvacuum_freeze_table_age = 150000000\n\n-- Application pattern running long transactions that pin the xmin horizon\nBEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT * FROM heavy_analytics_report; -- Held open for 12 hours without COMMIT\n-- While concurrent batch ingest executes 300 million transactions\nCOMMIT;",
    "solution_desc": "Mitigate freeze starvation by tuning autovacuum to process modern I/O bandwidth without artificial throttling, lowering freeze thresholds, and actively terminating idle-in-transaction connections. In emergency states near wraparound, run VACUUM FREEZE manually with high maintenance work memory and zero cost delay.",
    "good_code": "-- 1. Production postgresql.conf tuning for high-throughput write workloads\nautovacuum_vacuum_cost_delay = 2ms        -- Minimize sleep intervals\nautovacuum_vacuum_cost_limit = 2000       -- Scale budget for fast disks\nautovacuum_max_workers = 6\nmaintenance_work_mem = '2GB'\nautovacuum_freeze_max_age = 200000000\nvacuum_freeze_min_age = 10000000\n\n-- 2. Terminate rogue sessions blocking the global xmin horizon\nSELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE state IN ('idle in transaction', 'active')\n  AND (now() - xact_start) > interval '1 hour'\n  AND pid <> pg_backend_pid();\n\n-- 3. Targeted vacuum freeze on lagging tables\nVACUUM (VERBOSE, FREEZE, ANALYZE, PARALLEL 4) public.high_churn_events;",
    "verification": "Query `pg_database` and `pg_class` to verify that `age(datfrozenxid)` and `age(relfrozenxid)` decrease safely below 50,000,000 using `SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY age(datfrozenxid) DESC;`.",
    "date": "2026-09-25",
    "id": 1790345928,
    "type": "error"
});