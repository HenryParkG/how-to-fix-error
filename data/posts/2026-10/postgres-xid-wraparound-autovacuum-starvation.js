window.onPostDataLoaded({
    "title": "Fixing PostgreSQL XID Wraparound & Autovacuum Starvation",
    "slug": "postgres-xid-wraparound-autovacuum-starvation",
    "language": "SQL",
    "code": "ERR_XID_WRAPAROUND",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on a 32-bit transaction counter providing approximately 4.29 billion transaction IDs (XIDs). Because transaction comparison uses modulo-2^32 arithmetic, any active table whose oldest unvacuumed transaction ID (<code>pg_class.relfrozenxid</code>) approaches 2 billion transactions in age risks silent data corruption via wrap-around. To prevent this catastrophic state, the database issues aggressive warnings before eventually shutting down write operations entirely with <code>PANIC: database is not accepting commands to avoid wraparound data loss</code>.</p><p>Emergency autovacuum workers are automatically dispatched when a table exceeds <code>autovacuum_freeze_max_age</code>. However, these critical freeze workers can be starved or deadlocked by long-running analytical queries, uncommitted <code>idle in transaction</code> sessions holding lock queues, or heavily throttled I/O settings via <code>autovacuum_vacuum_cost_limit</code>. When starved, the XID consumption continues outrunning the freezer until emergency shutdown locks all DML operations.</p>",
    "root_cause": "Emergency autovacuum workers fail to advance relfrozenxid because long-running transactions hold snapshot locks on table pages, or autovacuum cost throttle limits cause freeze sweeps to execute slower than incoming XID burn rates.",
    "bad_code": "-- Default / Throttled autovacuum settings under heavy write throughput\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 20;\nALTER SYSTEM SET autovacuum_max_workers = 3;\n\n-- Long-running reporting query holding snapshot open for hours\nBEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT * FROM billing_events WHERE created_at < NOW() - INTERVAL '30 days';\n-- Connection remains open without committing, blocking freeze horizon",
    "solution_desc": "Mitigate the starvation by identifying and terminating all blocking sessions holding snapshots older than the freeze horizon, temporarily removing autovacuum I/O throttles, boosting autovacuum worker limits, and manually running an aggressive FREEZE VACUUM on the lagging tables.",
    "good_code": "-- 1. Terminate sessions blocking vacuum progression\nSELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE backend_xmin IS NOT NULL\n  AND pid <> pg_backend_pid()\n  AND age(backend_xmin) > 50000000;\n\n-- 2. Temporarily unthrottle autovacuum for emergency catch-up\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 0;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 10000;\nSELECT pg_reload_conf();\n\n-- 3. Run explicit, non-blocking aggressive freeze vacuum\nVACUUM (FREEZE, VERBOSE, ANALYZE) public.billing_events;",
    "verification": "Query `pg_database` and `pg_class` to verify that `age(datfrozenxid)` drops well below `autovacuum_freeze_max_age` (typically 200M transactions): `SELECT datname, age(datfrozenxid) FROM pg_database;`.",
    "date": "2026-10-05",
    "id": 1791169717,
    "type": "error"
});