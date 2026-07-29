window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Multixact Wraparound Lock Contention",
    "slug": "fixing-postgres-multixact-wraparound-lock-contention",
    "language": "SQL",
    "code": "TXID Lock Contention",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL multixact IDs (MultiXactId) are assigned when multiple transactions concurrently lock a tuple using SELECT ... FOR SHARE or FOR KEY SHARE. Under extreme transactional concurrency, multixact wraparound safety checks trigger forced synchronous VACUUM operations. This leads to heavy lock contention on MultiXactSLRU locks (such as MultiXactOffsetControlLock and MultiXactMemberControlLock), stalling incoming queries and causing system-wide database connection starvation.</p>",
    "root_cause": "Excessive usage of SELECT FOR SHARE/KEY SHARE combined with delayed autovacuum processing causes oldest_multi_xid to reach wraparound limits, forcing foreground queries into severe SLRU buffer lock contention.",
    "bad_code": "-- Run repeatedly by thousands of concurrent application workers\nBEGIN;\nSELECT * FROM active_orders WHERE tenant_id = 42 FOR SHARE;\n-- Heavy business logic delays transaction completion\nCOMMIT;",
    "solution_desc": "Tune autovacuum settings specifically for multixact age thresholds, optimize high-frequency queries to rely on optimistic concurrency instead of explicit row locking, and increase SLRU buffer sizes if supported.",
    "good_code": "-- Database tuning configuration fixes\nALTER SYSTEM SET autovacuum_multixact_freeze_max_age = 400000000;\nALTER TABLE active_orders SET (\n    autovacuum_multixact_freeze_min_age = 10000000,\n    autovacuum_multixact_freeze_table_age = 150000000\n);\nSELECT pg_reload_conf();\n\n-- Application query refactoring using optimistic concurrency\nSELECT id, status, xmax FROM active_orders WHERE tenant_id = 42;\n-- Perform application work, then update matching lock target:\nUPDATE active_orders SET status = 'PROCESSING' WHERE id = 123 AND xmax = 0;",
    "verification": "Query `pg_stat_activity` and `pg_locks` during load tests to verify the complete absence of wait events on `MultiXactMemberSLRU` and `MultiXactOffsetSLRU`.",
    "date": "2026-07-29",
    "id": 1785313268,
    "type": "error"
});