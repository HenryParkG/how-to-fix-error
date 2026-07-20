window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound Failures",
    "slug": "fixing-postgresql-txid-wraparound-failures",
    "language": "PostgreSQL",
    "code": "TXID Wraparound",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) system, limiting active IDs to approximately 4 billion. At any moment, half of these are considered in the past, and half in the future. Under heavy, sustained write loads, if the database approaches 2 billion transactions without 'freezing' old transaction IDs, a wraparound emergency occurs. When this threshold is crossed, PostgreSQL goes into a hard read-only mode to prevent catastrophic data loss and data corruption.</p>",
    "root_cause": "The automatic vacuum (autovacuum) background process is configured too conservatively, or is blocked from advancing the 'frozen transaction ID' due to long-running analytical queries, abandoned replication slots, or orphaned 2PC (two-phase commit) transactions.",
    "bad_code": "-- Inadequate postgresql.conf settings under heavy write throughput\nautovacuum_max_workers = 3\nautovacuum_vacuum_scale_factor = 0.2\nautovacuum_vacuum_cost_limit = 200\n\n-- Identifying active blocking transactions that prevent TXID advances:\nSELECT pid, age(backend_xmin), query, state \nFROM pg_stat_activity \nWHERE backend_xmin IS NOT NULL \nORDER BY age(backend_xmin) DESC LIMIT 5;",
    "solution_desc": "Tune the autovacuum parameters to make vacuuming significantly more aggressive. Identify and drop abandoned replication slots, abort stalled prepared transactions, terminate long-running processes, and run a manual 'VACUUM FREEZE' on tables with high age.",
    "good_code": "-- 1. Tune postgresql.conf for aggressive vacuum processing\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000; -- Trigger aggressive vacuum early\nSELECT pg_reload_conf();\n\n-- 2. Identify and resolve blocking resources\n-- Force-terminate backends holding onto old snapshots\nSELECT pg_terminate_backend(pid) \nFROM pg_stat_activity \nWHERE age(backend_xmin) > 10000000;\n\n-- Drop inactive physical or logical replication slots preventing TXID cleanup\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false;\n\n-- 3. Execute manual freeze on high-risk tables immediately\nVACUUM FREEZE ANALYZE verbose intensive_write_table;",
    "verification": "Query `select datname, age(datfrozenxid) from pg_database;` and verify that the age value drops significantly below 10,000,000, well out of the danger zone.",
    "date": "2026-07-20",
    "id": 1784539128,
    "type": "error"
});