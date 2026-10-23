window.onPostDataLoaded({
    "title": "Mitigate PostgreSQL MultiXact ID Wraparound Halts",
    "slug": "mitigate-postgresql-multixact-id-wraparound-halts",
    "language": "SQL",
    "code": "ERRCODE_PROGRAM_LIMIT_EXCEEDED",
    "tags": [
        "PostgreSQL",
        "SQL",
        "Database",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses MultiXact IDs (MultiXactId) when multiple backend transactions place shared row-level locks on the same tuple (e.g., <code>SELECT ... FOR KEY SHARE</code>, <code>FOR SHARE</code>), or when savepoints (subtransactions) lock rows. These multi-transaction lock combinations are tracked in <code>pg_multixact/offsets</code> and <code>pg_multixact/members</code>.</p><p>MultiXact IDs are circular 32-bit integers. If a database approaches 2 billion MultiXacts without vacuuming, PostgreSQL initiates emergency safety mechanisms. It first triggers aggressive autovacuuming (<code>autovacuum_multixact_freeze_max_age</code>). If long-running transactions or unconsumed subtransactions pin <code>oldestMultiXactId</code>, PostgreSQL forcibly refuses new commands and halts write transactions with errors such as <code>MultiXactId 2147483648 has does not exist</code> or <code>database is not accepting commands to avoid wraparound data loss</code>.</p>",
    "root_cause": "Long-lived subtransactions and concurrent shared row locks holding oldestMultiXactId unadvanced beyond autovacuum_multixact_freeze_max_age thresholds, preventing pg_multixact file truncation.",
    "bad_code": "-- Antipattern: High-concurrency worker using savepoints with shared locks\nBEGIN;\n-- Long transaction running for hours\nSELECT * FROM billing_accounts WHERE tenant_id = 42;\n\n-- Nested subtransactions generating continuous MultiXact entries\nSAVEPOINT sp_batch_1;\nSELECT * FROM orders WHERE status = 'PENDING' FOR SHARE;\n-- Heavy processing...\nRELEASE SAVEPOINT sp_batch_1;\n\nSAVEPOINT sp_batch_2;\nSELECT * FROM orders WHERE status = 'PENDING' FOR SHARE;\n-- MultiXact allocations increase rapidly while oldestMultiXact remains pinned\nRELEASE SAVEPOINT sp_batch_2;\nCOMMIT;",
    "solution_desc": "Identify and terminate lingering transactions pinning datminmxid. Eliminate high-frequency subtransaction-level row locking in application code. Tune autovacuum to aggressively freeze MultiXact IDs earlier by adjusting autovacuum_multixact_freeze_max_age and vacuum_multixact_freeze_min_age. Execute a manual, multi-threaded VACUUM FREEZE on affected relations.",
    "good_code": "-- 1. Identify oldest MultiXact age and relations blocking cleanup\nSELECT c.oid::regclass AS table_name,\n       pg_size_pretty(pg_total_relation_size(c.oid)) AS size,\n       mxid_age(c.relminmxid) AS multixact_age\nFROM pg_class c\nJOIN pg_namespace n ON n.oid = c.relnamespace\nWHERE c.relkind = 'r' AND n.nspname NOT IN ('pg_catalog', 'information_schema')\nORDER BY multixact_age DESC\nLIMIT 10;\n\n-- 2. Tune database parameters dynamically to prevent halt\nALTER SYSTEM SET autovacuum_multixact_freeze_max_age = 400000000;\nALTER SYSTEM SET vacuum_multixact_freeze_min_age = 10000000;\nALTER SYSTEM SET vacuum_cost_limit = 2000;\nSELECT pg_reload_conf();\n\n-- 3. Execute non-blocking aggressive freeze on critical tables\nVACUUM (FREEZE, VERBOSE, ANALYZE) public.orders;",
    "verification": "Monitor `SELECT datname, mxid_age(datminmxid) FROM pg_database;` to confirm MultiXact age drops well below `autovacuum_multixact_freeze_max_age`. Check `pg_stat_progress_vacuum` to verify freeze completion across all high-churn tables.",
    "date": "2026-10-23",
    "id": 1792763849,
    "type": "error"
});