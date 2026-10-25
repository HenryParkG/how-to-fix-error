window.onPostDataLoaded({
    "title": "Prevent Postgres Shutdowns from MultiXactId Wraparound",
    "slug": "prevent-postgresql-multixactid-wraparound-shutdowns",
    "language": "SQL",
    "code": "ERRCODE_PROGRAM_LIMIT_EXCEEDED",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Database",
        "DevOps",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses MultiXactIds when multiple transactions concurrently lock a row in shared mode (e.g., via <code>SELECT ... FOR SHARE</code>, foreign key validations, or advisory locks). Much like normal 32-bit Transaction IDs (XIDs), MultiXactIds are circular and subject to wraparound. PostgreSQL enforces emergency fail-safe shutdowns when the oldest active MultiXactId approaches 2 billion transactions behind the current counter.</p><p>If the autovacuum daemon is throttled, misconfigured, or blocked by long-running transactions, it fails to advance <code>relminmxid</code>. Once the remaining MultiXactIds fall below <code>autovacuum_multixact_freeze_max_age</code>, the server enters aggressive freeze mode. If this continues past the emergency threshold, PostgreSQL terminates all active connections, shuts down, and refuses read-write operations with the error: <code>FATAL: MultiXactId wrap limit is exceeded</code>.</p>",
    "root_cause": "Autovacuum worker starvation combined with persistent row-level shared locks (often from high-frequency foreign key checks) prevents MultiXactId freezing, allowing the oldest multi-transaction ID to exceed safety margins.",
    "bad_code": "-- Default un-tuned autovacuum settings under heavy shared lock concurrency\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 20; -- Throttle autovacuum severely\nALTER SYSTEM SET autovacuum_max_workers = 3;\n\n-- Long-running read queries holding shared locks prevent multi-xact truncation\nBEGIN;\nSELECT * FROM parent_table WHERE status = 'PENDING' FOR SHARE;\n-- Session left open indefinitely while high-volume child table inserts generate MultiXact IDs",
    "solution_desc": "Tune autovacuum settings specifically for freezing MultiXactIds, eliminate long-lived transactions holding row locks, and decrease freeze thresholds on high-churn foreign-key referenced tables. In an emergency shutdown, boot PostgreSQL into single-user mode to run VACUUM FREEZE manually.",
    "good_code": "-- 1. Allocate dedicated I/O throughput to autovacuum\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 0;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_max_workers = 6;\n\n-- 2. Lower MultiXact freeze thresholds to trigger proactive cleanup\nALTER SYSTEM SET autovacuum_multixact_freeze_max_age = 400000000;\nALTER SYSTEM SET vacuum_multixact_freeze_min_age = 10000000;\n\n-- 3. Configure aggressive table-level vacuum settings on high-churn tables\nALTER TABLE parent_table SET (\n    autovacuum_multixact_freeze_min_age = 5000000,\n    autovacuum_multixact_freeze_table_age = 100000000,\n    autovacuum_vacuum_cost_delay = 0\n);\n\n-- Run manual aggressive vacuum freeze to advance relminmxid\nVACUUM FREEZE ANALYZE parent_table;",
    "verification": "Query `SELECT datname, age(datminmxid), mxid_age(datminmxid) FROM pg_database;` to confirm `mxid_age` is safely below the threshold of 400,000,000. Inspect `pg_stat_activity` to ensure autovacuum workers are executing `vacuum (to prevent multixact wraparound)`.",
    "date": "2026-10-25",
    "id": 1792935353,
    "type": "error"
});