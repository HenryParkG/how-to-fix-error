window.onPostDataLoaded({
    "title": "Fixing Postgres TXID Wraparound Autovacuum Lockouts",
    "slug": "fixing-postgres-txid-wraparound-autovacuum-lockouts",
    "language": "PostgreSQL",
    "code": "TXID Lockout",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on 32-bit Transaction IDs (TXIDs). Because 32-bit integers cap at roughly 4 billion values, PostgreSQL considers TXIDs within a 2-billion transaction window as past transactions and others as future ones. To prevent data corruption caused by TXID wraparound, autovacuum regularly executes an aggressive 'FREEZE' scan to mark old tuple headers as frozen.</p><p>Under extreme write workloads, explicit table locks (e.g., `ALTER TABLE`, heavy bulk `UPDATE`/`DELETE` locks) or long-running transactions holding old snapshots prevent autovacuum workers from obtaining an `AccessExclusiveLock` or standard table scan locks. If autovacuum continuously gets cancelled or times out, the TXID distance approaches `autovacuum_freeze_max_age` (default 200M). Once `max_connections` or emergency TXID limits are reached, PostgreSQL enters read-only emergency mode to prevent silent data loss, locking out all write transactions.</p>",
    "root_cause": "Autovacuum worker threads are canceled by high-priority query lock timeouts or blocked by long-running transactions holding snapshot horizons, preventing required tuple freezing before the 2-billion TXID wraparound hard cap.",
    "bad_code": "-- Default or insufficient autovacuum settings under heavy write pressure\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_max_workers = 3;\n-- Long-running query blocking autovacuum freeze worker:\nSELECT * FROM large_analytics_table WHERE status = 'PROCESSING'; -- Holds old xmin horizon",
    "solution_desc": "Resolve lockouts by terminating long-running idle transactions, adjusting autovacuum cost delays, raising worker limits, and enforcing aggressive autovacuum cost limits during peak load. Set `idle_in_transaction_session_timeout` to kill abandoned transactions blocking vacuum horizons, and manually run emergency `VACUUM FREEZE` on critical tables.",
    "good_code": "-- 1. Terminate blocking transactions\nSELECT pg_terminate_backend(pid) \nFROM pg_stat_activity \nWHERE state = 'idle in transaction' \n  AND now() - state_change > interval '5 minutes';\n\n-- 2. Scale autovacuum aggressive performance\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 0;\nALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';\nSELECT pg_reload_conf();\n\n-- 3. Manually execute aggressive freeze on high-age tables\nVACUUM FREEZE ANALYZE VERBOSE high_write_table;",
    "verification": "Query `pg_database` to verify transaction age drops safely below warning thresholds: `SELECT datname, age(datfrozenxid) FROM pg_database WHERE age(datfrozenxid) > 50000000;`.",
    "date": "2026-08-11",
    "id": 1786409997,
    "type": "error"
});