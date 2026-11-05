window.onPostDataLoaded({
    "title": "Resolving PostgreSQL TXID Wraparound Starvation",
    "slug": "postgresql-txid-wraparound-autovacuum-starvation",
    "language": "SQL",
    "code": "TXIDWraparound",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) space, providing approximately 4.2 billion distinct transactions. To prevent transaction ID collision, PostgreSQL implements a MVCC visibility horizon where transactions older than 2 billion commits in the past are considered to be in the frozen past. Autovacuum automatically triggers anti-wraparound vacuums when a table's oldest transaction age reaches <code>autovacuum_freeze_max_age</code> (default 200 million transactions).</p><p>Autovacuum starvation occurs when long-running read transactions, abandoned prepared transactions, or stale replication slots hold back the global <code>datfrozenxid</code>. When the system approaches <code>txid_limit</code> (around 2.1 billion transactions), PostgreSQL shuts down into single-user safe mode to prevent silent data corruption, rejecting incoming write transactions with fatal errors like <code>ERROR: database is not accepting commands to avoid wraparound data loss in database \"postgres\"</code>.</p>",
    "root_cause": "Long-running transactions, orphaned 2PC transactions, or inactive logical replication slots hold back 'datfrozenxid', while aggressive autovacuum is throttled by conservative vacuum_cost_limit or blocked by exclusive table locks.",
    "bad_code": "-- Default or conservative settings that trigger autovacuum throttling\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 20;\nALTER SYSTEM SET autovacuum_max_workers = 3;\n\n-- Long-running orphaned transaction holding back datfrozenxid\nBEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT * FROM large_table WHERE status = 'PENDING';\n-- Connection remains IDLE IN TRANSACTION for hours or days without COMMIT",
    "solution_desc": "Identify and terminate blocking sessions, drop stale replication slots, increase autovacuum throughput by tuning cost limits and worker memory, and run targeted parallel VACUUM FREEZE operations on tables with high age(relfrozenxid).",
    "good_code": "-- 1. Terminate transactions older than 1 hour holding the horizon\nSELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE state IN ('idle in transaction', 'active')\n  AND (now() - xact_start) > INTERVAL '1 hour'\n  AND pid <> pg_backend_pid();\n\n-- 2. Drop abandoned replication slots holding datminmxid/datfrozenxid\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false AND (xmin IS NOT NULL OR catalog_xmin IS NOT NULL);\n\n-- 3. Temporarily remove autovacuum throttling for fast recovery\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 0;\nALTER SYSTEM SET vacuum_cost_limit = 10000;\nALTER SYSTEM SET maintenance_work_mem = '2GB';\nSELECT pg_reload_conf();\n\n-- 4. Execute aggressive manual freeze on critical tables\nVACUUM (FREEZE, VERBOSE, ANALYZE) high_churn_table;",
    "verification": "Query 'SELECT datname, age(datfrozenxid) FROM pg_database;' and confirm age decreases below 10,000,000. Verify pg_stat_progress_vacuum reflects completed freeze operations.",
    "date": "2026-11-05",
    "id": 1793852401,
    "type": "error"
});