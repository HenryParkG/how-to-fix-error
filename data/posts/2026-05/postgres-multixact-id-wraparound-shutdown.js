window.onPostDataLoaded({
    "title": "Fixing Postgres MultiXact ID Wraparound Shutdowns",
    "slug": "postgres-multixact-id-wraparound-shutdown",
    "language": "SQL",
    "code": "MultiXact Wraparound",
    "tags": [
        "SQL",
        "Infra",
        "Postgres",
        "Error Fix"
    ],
    "analysis": "<p>In PostgreSQL, when multiple transactions lock a row concurrently (using row-level shared locks like <code>SELECT SHARE</code>), the database creates a MultiXact ID (MXID) to coordinate ownership. Similar to Transaction IDs (XIDs), MultiXacts use a 32-bit counter that wraps around at 2 billion entries. Under high-throughput transaction workloads with intense row-level lock contention, the database can burn through MXIDs rapidly.</p><p>If autovacuum cannot clean up old MultiXact values (because long-running transactions, orphaned preparation transactions, or replication slots hold back the global horizon), PostgreSQL will trigger an emergency database shutdown to prevent data corruption. Once this state is reached, the engine will refuse to accept write connections, allowing only system-level single-user recovery mode.</p>",
    "root_cause": "Intense lock contention preventing autovacuum from freezing MultiXact IDs, coupled with conservative autovacuum freeze threshold parameters. When the age of the oldest MultiXact exceeds 'autovacuum_multixact_freeze_max_age', and vacuuming fails to complete, the database shuts down as a failsafe protection.",
    "bad_code": "-- Standard database settings lacking aggressive MultiXact autovacuum configurations\n-- This leaves the default wide thresholds that trigger the wraparound shutdown on write-heavy databases\nALTER SYSTEM SET autovacuum_multixact_freeze_max_age = 400000000; -- Too large under heavy lock workloads\nALTER SYSTEM SET vacuum_defer_cleanup_age = 100000; -- Delays cleanup horizons\n\n-- Example of bad application pattern causing long-held locks:\n-- BEGIN;\n-- SELECT * FROM orders WHERE status = 'pending' FOR SHARE; -- Locks held indefinitely without quick COMMIT",
    "solution_desc": "Configure PostgreSQL to aggressively vacuum MultiXacts by lowering `autovacuum_multixact_freeze_max_age` and reducing `vacuum_multixact_failsafe_age`. If the server is in shutdown mode, restart the server in single-user mode (`postgres --single -D /var/lib/postgresql/data template1`) to run a manual, aggressive `VACUUM FREEZE` command, and configure connection timeouts to terminate runaway transactions holding locks.",
    "good_code": "-- 1. Tune PostgreSQL system settings for aggressive autovacuuming of MultiXacts\nALTER SYSTEM SET autovacuum_multixact_freeze_max_age = 150000000; -- Proactive cleanup\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;            -- Gives autovacuum more I/O throughput\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2;             -- Minimizes sleep cycles for vacuum worker\nSELECT pg_reload_conf();\n\n-- 2. Detect and automatically terminate long-running lock-holding transactions\nALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';   -- Kills idle transactions holding locks\nALTER SYSTEM SET lock_timeout = '10s';\nSELECT pg_reload_conf();\n\n-- 3. (If Recovery is Needed) Run manual database-wide freeze\n-- Execute in single-user mode or high-priority maintenance window:\n-- VACUUM FREEZE ANALYZE VERBOSE;",
    "verification": "Monitor the current MultiXact age of all databases in the cluster using: `SELECT datname, age(datminmxid) FROM pg_database;`. Ensure that the calculated age remains safely below the `autovacuum_multixact_freeze_max_age` threshold even under high concurrent load.",
    "date": "2026-05-20",
    "id": 1779259269,
    "type": "error"
});