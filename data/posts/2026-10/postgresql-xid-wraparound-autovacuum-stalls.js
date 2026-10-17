window.onPostDataLoaded({
    "title": "Preventing PostgreSQL XID Wraparound and Autovacuum Stalls",
    "slug": "postgresql-xid-wraparound-autovacuum-stalls",
    "language": "PostgreSQL",
    "code": "ERR_XID_WRAPAROUND",
    "tags": [
        "PostgreSQL",
        "Database",
        "Autovacuum",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on 32-bit transaction IDs (XIDs), creating a theoretical limit of approximately 4.29 billion transactions. To prevent transaction ID collision, PostgreSQL treats XIDs as a circular ring buffer: past transactions are visible within the prior 2 billion IDs, while future ones are forward. When the database approaches 2 billion transactions without freezing old rows, it enters emergency shutdown mode (<code>database is not accepting commands to avoid wraparound data loss</code>) to prevent catastrophic data corruption.</p><p>Autovacuum is designed to freeze old XIDs continuously, advancing <code>relfrozenxid</code>. However, autovacuum workers are frequently starved or stalled due to restrictive default throttling settings (<code>autovacuum_vacuum_cost_limit</code>), table lock contention, long-running transactions, or abandoned replication slots holding back the catalog horizon.</p>",
    "root_cause": "Unchecked consumption of 32-bit transaction IDs coupled with stalled autovacuum freeze operations caused by abandoned replication slots, long-running active or idle transactions, or inadequate autovacuum cost throttle ceilings.",
    "bad_code": "-- Default / Unoptimized postgresql.conf settings under high write load\nautovacuum_max_workers = 3\nautovacuum_vacuum_cost_limit = 200\nautovacuum_vacuum_cost_delay = 20ms\nautovacuum_freeze_max_age = 200000000\n\n-- Abandoned replication slot or idle connection holding back xmin:\nSELECT slot_name, active, xmin, catalog_xmin \nFROM pg_replication_slots \nWHERE active = false;",
    "solution_desc": "Mitigate wraparound by tuning autovacuum for aggressive freezing, monitoring database age via monitoring scripts, terminating long-running idle transactions, and dropping inactive replication slots that pin the global catalog horizon.",
    "good_code": "-- 1. Tune autovacuum in postgresql.conf for modern NVMe storage\nautovacuum_max_workers = 6\nautovacuum_vacuum_cost_limit = 2000\nautovacuum_vacuum_cost_delay = 2ms\nvacuum_freeze_min_age = 50000000\nvacuum_freeze_table_age = 150000000\nautovacuum_freeze_max_age = 200000000\nidle_in_transaction_session_timeout = '60s'\n\n-- 2. Terminate orphan transactions and drop inactive slots\nSELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE state in ('idle in transaction', 'active')\n  AND (now() - xact_start) > interval '1 hour';\n\nSELECT pg_drop_replication_slot(slot_name)\nFROM pg_replication_slots\nWHERE active = false AND catalog_xmin IS NOT NULL;\n\n-- 3. Execute emergency freeze on critical tables\nVACUUM FREEZE VERBOSE ANALYZE pg_catalog.pg_class;",
    "verification": "Monitor remaining transactions until emergency wraparound with: `SELECT datname, age(datfrozenxid), 2147483648 - age(datfrozenxid) AS remaining_txids FROM pg_database ORDER BY remaining_txids ASC;`. Ensure remaining_txids stays comfortably above 200 million.",
    "date": "2026-10-17",
    "id": 1792203050,
    "type": "error"
});