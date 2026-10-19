window.onPostDataLoaded({
    "title": "Fix Postgres Transaction ID Wraparound Freeze",
    "slug": "fix-postgres-txid-wraparound-freeze",
    "language": "PostgreSQL",
    "code": "ERR_TXID_WRAPAROUND",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on a 32-bit transaction identifier (<code>txid</code>) space, representing roughly 4.2 billion transactions. To maintain multi-version concurrency control (MVCC) visibility, Postgres compares transaction IDs modulo 2^31. As a cluster approaches 2 billion transactions without freezing old tuples, it triggers emergency autovacuum workers to freeze table rows and advance <code>relfrozenxid</code>.</p><p>If autovacuum cannot keep up\u2014often blocked by orphaned replication slots, long-running read transactions, or aggressive autovacuum cost throttle defaults\u2014PostgreSQL reaches <code>autovacuum_freeze_max_age</code>. When <code>txid_current()</code> reaches three million transactions before absolute wraparound (<code>txid_limit - 3,000,000</code>), Postgres enters safe read-only mode and refuses to accept write operations, issuing severe errors to prevent data corruption.</p>",
    "root_cause": "The oldest unvacuumed transaction age exceeds autovacuum_freeze_max_age because long-running transactions, prepared transactions, or abandoned replication slots pinned the global xmin horizon, blocking aggressive freezing autovacuums.",
    "bad_code": "-- postgresql.conf throttles autovacuum under high write throughput\nautovacuum_vacuum_cost_limit = 200\nautovacuum_vacuum_cost_delay = 20ms\nautovacuum_max_workers = 3\n\n-- Stale replication slot holding xmin horizon\nSELECT slot_name, active, xmin, catalog_xmin \nFROM pg_replication_slots \nWHERE active = false;",
    "solution_desc": "Terminate blocking backends and drop stale replication slots to release the xmin horizon. Increase vacuum cost limits and run manual, aggressive VACUUM FREEZE with higher maintenance_work_mem to unfreeze transaction IDs before the server goes into emergency shutdown mode.",
    "good_code": "-- 1. Identify and drop inactive replication slots holding the horizon\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false AND xmin IS NOT NULL;\n\n-- 2. Cancel blocking queries running longer than 1 hour\nSELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE state != 'idle' \n  AND backend_type = 'client backend'\n  AND now() - xact_start > interval '1 hour';\n\n-- 3. Run aggressive manual vacuum with increased resource allocation\nSET maintenance_work_mem = '2GB';\nSET vacuum_cost_limit = 10000;\nSET vacuum_cost_delay = 0;\nVACUUM FREEZE VERBOSE ANALYZE;",
    "verification": "Execute `SELECT datname, age(datfrozenxid) FROM pg_database;` and verify that the age metric drops safely below 200,000,000.",
    "date": "2026-10-19",
    "id": 1792376810,
    "type": "error"
});