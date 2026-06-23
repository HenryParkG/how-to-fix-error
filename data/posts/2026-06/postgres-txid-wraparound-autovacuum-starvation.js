window.onPostDataLoaded({
    "title": "Fixing Postgres TXID Wraparound and Starvation",
    "slug": "postgres-txid-wraparound-autovacuum-starvation",
    "language": "SQL",
    "code": "TXIDWraparound",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses Multi-Version Concurrency Control (MVCC) to handle concurrent transactions. Every row has a creation transaction ID (xmin) and deletion transaction ID (xmax). Since these are stored as unsigned 32-bit integers, they wrap around every 4 billion transactions. To prevent data loss where old transactions suddenly look like future ones, Postgres enforces a 'vacuum' process to freeze old transaction IDs.</p><p>If autovacuum is starved\u2014meaning it is unable to acquire clean table locks due to long-running transactions, orphaned replication slots, or heavy manual table locks\u2014the oldest transaction ID (relfrozenxid) cannot advance. When the age of the database reaches 2 billion transactions, Postgres enters safety shutdown mode, refusing to execute writes.</p>",
    "root_cause": "Long-lived idle-in-transaction sessions, uncommitted prepared 2PC transactions, or inactive replication slots block autovacuum from sweeping old tuple versions. This blocks the advancing of pg_database.datfrozenxid and triggers autovacuum starvation.",
    "bad_code": "-- Poorly configured postgresql.conf that starves autovacuum\nautovacuum_max_workers = 3                  # Too low for active multi-DB servers\nautovacuum_vacuum_cost_limit = 200          # Too slow, autovacuum is throttled\nautovacuum_vacuum_scale_factor = 0.2        # Requires 20% table drift before vacuuming\n\n-- Dangerous long-running transaction block\nBEGIN;\nSELECT * FROM critical_orders WHERE status = 'pending' FOR UPDATE;\n-- Client goes offline or waits indefinitely, holding locks...",
    "solution_desc": "Tune autovacuum settings in postgresql.conf to be more aggressive (increase worker limits, increase cost limits, lower scale factors). Identify and terminate active blocking queries, stale replication slots, or prepared transactions using admin queries, and execute a manual VACUUM FREEZE on highly active tables.",
    "good_code": "-- 1. Optimized postgresql.conf parameters\n-- ALTER SYSTEM SET autovacuum_max_workers = 8;\n-- ALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\n-- ALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2; -- lower delay\n-- ALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n\n-- 2. SQL Query to locate and terminate blocking transactions holding back relfrozenxid\nSELECT \n    pid, \n    age(backend_xmin) AS tx_age, \n    query, \n    state, \n    usename\nFROM pg_stat_activity \nWHERE backend_xmin IS NOT NULL \nORDER BY age(backend_xmin) DESC \nLIMIT 5;\n\n-- 3. Kill the blocking backend process holding up the vacuum\n-- SELECT pg_terminate_backend(<pid>);\n\n-- 4. Check status of database age toward wraparound\nSELECT \n    datname, \n    age(datfrozenxid) AS database_age \nFROM pg_database \nORDER BY database_age DESC;",
    "verification": "Run the database age query and verify database_age decreases significantly. Monitor autovacuum performance logs with log_autovacuum_min_duration = 0 to confirm that table freezes are completing without timing out.",
    "date": "2026-06-23",
    "id": 1782216421,
    "type": "error"
});