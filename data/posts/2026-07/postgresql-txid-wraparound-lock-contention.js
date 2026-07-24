window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound Lock Contention",
    "slug": "postgresql-txid-wraparound-lock-contention",
    "language": "PostgreSQL",
    "code": "Lock Contention / Stale Snapshot Horizon",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>In high-write PostgreSQL environments, uncommitted transactions or abandoned logical replication slots hold back the global transaction ID snapshot horizon (<code>oldest_xmin</code>). As active transactions approach the 2-billion transaction limit, PostgreSQL triggers aggressive, un-throttled autovacuum processes to prevent transaction ID (TXID) wraparound. This creates intense IOPS utilization and heavy exclusive lock contention on catalog tables and database pages, causing query timeouts across the application tier.</p>",
    "root_cause": "Stale open transactions or inactive logical replication slots hold back the `xmin` horizon, preventing regular autovacuum operations from freezing old tuples, eventually forcing dynamic emergency wraparound vacuums.",
    "bad_code": "-- Query showing long-running idle in transaction holding snapshot horizon\nSELECT pid, xact_start, state, query \nFROM pg_stat_activity \nWHERE state = 'idle in transaction' \n  AND xact_start < NOW() - INTERVAL '30 minutes';\n\n-- Inactive replication slots blocking xmin cleanup\nSELECT slot_name, plugin, database, active, xmin, catalog_xmin \nFROM pg_replication_slots \nWHERE active = false;",
    "solution_desc": "Set strict database-level timeouts for idle transactions (`idle_in_transaction_session_timeout`) and old snapshot retention. Programmatically drop or reset inactive replication slots, and tune autovacuum freeze parameters to run proactively during normal workload periods.",
    "good_code": "-- Configure global transaction limits and proactive freezing in postgresql.conf\nALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';\nALTER SYSTEM SET statement_timeout = '30s';\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nSELECT pg_reload_conf();\n\n-- Drop unneeded or abandoned logical replication slots keeping stale xmin horizons\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false AND catalog_xmin IS NOT NULL;",
    "verification": "Execute `SELECT max(age(datfrozenxid)) FROM pg_database;` to confirm database age remains well below 100,000,000, and ensure `pg_stat_activity` reveals zero transactions exceeding the idle threshold.",
    "date": "2026-07-24",
    "id": 1784871685,
    "type": "error"
});