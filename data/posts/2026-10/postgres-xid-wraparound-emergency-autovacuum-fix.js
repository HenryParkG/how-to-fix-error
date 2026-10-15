window.onPostDataLoaded({
    "title": "Fixing PostgreSQL XID Wraparound and Multixact Exhaustion",
    "slug": "postgres-xid-wraparound-emergency-autovacuum-fix",
    "language": "PostgreSQL",
    "code": "ERR_XID_WRAPAROUND",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on a 32-bit transaction identifier (XID) system with circular modulo arithmetic to maintain multi-version concurrency control (MVCC). Because 32-bit integers yield approximately 4.29 billion distinct IDs, transactions older than 2 billion iterations in the past risk appearing to be in the future, which would lead to catastrophic data invisibility. To prevent this, PostgreSQL triggers an aggressive autovacuum freeze process when the age of any table's oldest unvacuumed XID crosses <code>autovacuum_freeze_max_age</code>. If the freeze process fails to keep pace with ingestion\u2014often due to conservative worker allocations, table-level locks, or abandoned prepared transactions\u2014PostgreSQL enters a fail-safe, read-only mode to prevent wraparound corruption.</p><p>A similar degradation occurs with MultiXact IDs (used for shared row-level locks). When <code>autovacuum_multixact_freeze_max_age</code> is breached without sufficient background cleanup, write queries stall completely with errors like <code>ERROR: database is not accepting commands to avoid wraparound data loss in database \"postgres\"</code>.</p>",
    "root_cause": "Unvacuumed tables breach `autovacuum_freeze_max_age` (or multixact equivalents) due to under-allocated autovacuum workers, aggressive maintenance cost delays, long-running queries holding snapshots, or abandoned two-phase commits (`PREPARED TRANSACTION`).",
    "bad_code": "-- Default / Conservative autovacuum settings under high write workloads\n-- postgresql.conf\nautovacuum_max_workers = 3\nautovacuum_vacuum_cost_limit = 200\nautovacuum_vacuum_cost_delay = 20ms\nautovacuum_freeze_max_age = 200000000\n\n-- Typical application trap: Unclosed prepared transaction blocking truncation\nBEGIN;\nPREPARE TRANSACTION 'stale_worker_tx_9281';\n-- Connection dropped without COMMIT PREPARED or ROLLBACK PREPARED",
    "solution_desc": "Mitigate the lock by identifying and clearing the blocking transactions or prepared transactions holding back `datfrozenxid`. Reconfigure `autovacuum` with elevated IO bandwidth allowances, reduce cost delays, increase workers, and aggressively freeze high-churn tables before the 2-billion limit triggers an emergency server lockdown.",
    "good_code": "-- 1. Detect lagging tables and oldest transaction ages\nSELECT c.relname, age(c.relfrozenxid), pg_size_pretty(pg_total_relation_size(c.oid))\nFROM pg_class c\nJOIN pg_namespace n ON n.oid = c.relnamespace\nWHERE c.relkind IN ('r', 't')\nORDER BY age(c.relfrozenxid) DESC\nLIMIT 5;\n\n-- 2. Identify abandoned prepared transactions or snapshots\nSELECT gid, prepared, owner, database FROM pg_prepared_xacts;\n-- Rollback orphaned locks: ROLLBACK PREPARED 'stale_worker_tx_9281';\n\n-- 3. High-throughput autovacuum tuning in postgresql.conf\n-- autovacuum_vacuum_cost_delay = 2ms\n-- autovacuum_vacuum_cost_limit = 2000\n-- autovacuum_max_workers = 6\n-- maintenance_work_mem = 2GB\n\n-- 4. Execute manual parallel freeze on the offending table\nVACUUM (FREEZE, VERBOSE, ANALYZE) high_churn_events;",
    "verification": "Query `SELECT datname, age(datfrozenxid) FROM pg_database;` to confirm transaction age decreases significantly below `autovacuum_freeze_max_age` and verify server log output indicates regular, non-emergency VACUUM completions.",
    "date": "2026-10-15",
    "id": 1792031082,
    "type": "error"
});