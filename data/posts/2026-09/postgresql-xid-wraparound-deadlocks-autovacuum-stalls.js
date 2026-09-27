window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL XID Wraparound Stalls",
    "slug": "postgresql-xid-wraparound-deadlocks-autovacuum-stalls",
    "language": "PostgreSQL",
    "code": "ERRCODE_PROGRAM_LIMIT_EXCEEDED",
    "tags": [
        "PostgreSQL",
        "SQL",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL employs a 32-bit transaction counter providing 4.29 billion transaction IDs (XIDs). To preserve MVCC consistency, autovacuum triggers aggressive freeze operations when any database's oldest transaction reaches <code>autovacuum_freeze_max_age</code> (typically 200 million transactions).</p><p>When an aggressive vacuum worker encounters heavy transactional load, long-running queries, or uncommitted two-phase transactions, lock conflicts arise. The vacuum must obtain a <code>ShareUpdateExclusiveLock</code>, which can be starved by lock queues. If the margin drops below 1 million transactions, PostgreSQL enters emergency read-only mode to prevent silent data corruption.</p>",
    "root_cause": "Orphaned prepared transactions, abandoned replication slots, or conservative I/O throttling (`autovacuum_vacuum_cost_limit`) prevent vacuum workers from advancing `datfrozenxid` before emergency wraparound triggers.",
    "bad_code": "-- Default conservative autovacuum settings under heavy write throughput\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_max_workers = 3;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n\n-- Abandoned two-phase commit transaction blocking datfrozenxid advance\nPREPARE TRANSACTION 'batch_import_worker_3';\n-- Never followed by COMMIT PREPARED or ROLLBACK PREPARED",
    "solution_desc": "Identify and remove blockers pinning transaction IDs, including stale prepared transactions and inactive replication slots. Reconfigure autovacuum cost limits dynamically and utilize PostgreSQL's failsafe mode (`vacuum_failsafe_age`) to bypass index cleanups and cost throttling during emergency freezing.",
    "good_code": "-- 1. Find and drop orphaned prepared transactions pinning oldest XID\nSELECT gid, prepared, owner, txid_current() - CAST(xmin AS text)::int8 AS age\nFROM pg_prepared_xacts\nORDER BY age DESC;\nROLLBACK PREPARED 'batch_import_worker_3';\n\n-- 2. Drop inactive logical replication slots\nSELECT slot_name, active, xmin, catalog_xmin FROM pg_replication_slots WHERE NOT active;\nSELECT pg_drop_replication_slot('stale_slot');\n\n-- 3. Increase autovacuum worker aggression and disable cost delay\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 10000;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 0;\nSELECT pg_reload_conf();\n\n-- 4. Execute targeted manual vacuum freeze with all cores\nVACUUM FREEZE (VERBOSE, ANALYZE) critical_table;",
    "verification": "Run `SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;` to ensure transaction ages remain comfortably below `autovacuum_freeze_max_age` (ideally < 50,000,000).",
    "date": "2026-09-27",
    "id": 1790519120,
    "type": "error"
});