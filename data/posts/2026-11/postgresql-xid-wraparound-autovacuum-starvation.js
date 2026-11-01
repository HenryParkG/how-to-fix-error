window.onPostDataLoaded({
    "title": "Preventing PostgreSQL Transaction ID Wraparound Outages",
    "slug": "postgresql-xid-wraparound-autovacuum-starvation",
    "language": "SQL",
    "code": "XIDWraparoundEmergency",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 32-bit transaction IDs (XIDs), providing approximately 4.29 billion transaction states. Utilizing modulo arithmetic, each active database cluster treats 2 billion past transactions as visible, while 2 billion future transactions are invisible. To prevent past transactions from silently cycling into the future (resulting in catastrophic data loss), PostgreSQL requires autovacuum to freeze old tuples before the gap between current transactions and <code>datfrozenxid</code> exceeds 2 billion.</p><p>When long-running transactions, orphaned prepared transactions, or abandoned physical/logical replication slots pin the cluster's horizon, autovacuum is starved. Once the safety ceiling <code>autovacuum_freeze_max_age</code> is reached, PostgreSQL forces emergency autovacuum workers. If these workers are throttled or fail to keep up, the cluster enters an unrecoverable read-only safety shutdown: <code>PANIC: database is not accepting commands to avoid wraparound data loss in database</code>.</p>",
    "root_cause": "Autovacuum worker starvation caused by unmonitored abandoned replication slots, conservative default vacuum cost limits, and long-running idle-in-transaction sessions holding back the cluster-wide transaction horizon.",
    "bad_code": "-- Default restrictive settings that throttle autovacuum workers during freeze crises\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 20; -- Old default (ms)\nALTER SYSTEM SET autovacuum_max_workers = 3;\n\n-- Stale transaction or forgotten slot holding the global horizon\nSELECT pg_create_logical_replication_slot('legacy_analytics_cdc', 'test_decoding');\n-- Abandoned client connection\nBEGIN;\nSELECT * FROM orders WHERE status = 'PENDING';\n-- Connection left open indefinitely without COMMIT or ROLLBACK",
    "solution_desc": "Identify and eliminate transactions and replication slots pinning `datfrozenxid`. Reconfigure autovacuum to run aggressively without artificial sleep delays, set aggressive session timeouts for idle transactions, and tune table-level freeze parameters for high-churn tables.",
    "good_code": "-- 1. Drop stale replication slots pinning horizon\nSELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))\nFROM pg_replication_slots WHERE active = false;\nSELECT pg_drop_replication_slot('legacy_analytics_cdc');\n\n-- 2. Configure aggressive system-wide autovacuum throughput\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2; -- Modern responsive vacuum\nALTER SYSTEM SET idle_in_transaction_session_timeout = '60000'; -- 60s kill switch\nSELECT pg_reload_conf();\n\n-- 3. Run manual freeze on critical tables approaching wraparound ceiling\nVACUUM FREEZE VERBOSE ANALYZE public.orders;\n\n-- 4. Monitor XID age across databases\nSELECT datname, age(datfrozenxid) AS xid_age, 2147483648 - age(datfrozenxid) AS remaining_xids\nFROM pg_database ORDER BY xid_age DESC;",
    "verification": "Execute `SELECT datname, age(datfrozenxid) FROM pg_database;` to confirm that all database XID ages drop significantly below 200,000,000 and that no backlogged tables appear in `pg_stat_user_tables` with high `n_dead_tup`.",
    "date": "2026-11-01",
    "id": 1793503328,
    "type": "error"
});