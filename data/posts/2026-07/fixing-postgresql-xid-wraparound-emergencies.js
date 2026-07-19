window.onPostDataLoaded({
    "title": "Fixing PostgreSQL XID Wraparound Emergencies",
    "slug": "fixing-postgresql-xid-wraparound-emergencies",
    "language": "SQL",
    "code": "XID Wraparound",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction identifier (XID) system, allowing approximately 4 billion transactions. Since transaction state must be compared across history, PostgreSQL divides this room in half, reserving 2 billion transactions for past visibility and 2 billion for future visibility. If the transaction count reaches 2 billion without cleanup, older transactions wrap around, risking severe data loss. To prevent this, PostgreSQL triggers a panic shutdown, entering read-only safety mode. This emergency is frequently caused by blocked or un-configured autovacuum tasks.</p>",
    "root_cause": "Autovacuum is blocked from advancing the database's minimum transaction epoch (datfrozenxid) due to long-running analytical queries, orphaned replication slots, or uncommitted two-phase commit (2PC) transactions.",
    "bad_code": "-- Detection queries to run when Autovacuum is blocked and the database is near shutdown:\n-- 1. Check current transaction age per database:\nSELECT datname, age(datfrozenxid) FROM pg_database WHERE datname = current_database();\n\n-- 2. Identify long-running transactions holding back xmin:\nSELECT pid, age(backend_xmin), query, state, query_start \nFROM pg_stat_activity \nWHERE state <> 'idle' \nORDER BY age(backend_xmin) DESC LIMIT 5;\n\n-- 3. Check for abandoned replication slots:\nSELECT slot_name, active, xmin, catalog_xmin FROM pg_replication_slots WHERE active = false;",
    "solution_desc": "To resolve the emergency, first terminate all blocking transactions, drop abandoned replication slots, and rollback long-running prepared transactions. Then, force an aggressive vacuum run using `VACUUM FREEZE` directly on the affected tables. Finally, tune PostgreSQL configurations to make autovacuum performant enough to prevent future near-wraparounds.",
    "good_code": "-- 1. Terminate blocking backend queries immediately\nSELECT pg_terminate_backend(pid) \nFROM pg_stat_activity \nWHERE age(backend_xmin) > 10000000 AND pid <> pg_backend_pid();\n\n-- 2. Clean up abandoned replication slots\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false;\n\n-- 3. Execute aggressive manual vacuuming targeting the oldest tables\nVACUUM FREEZE ANALYZE VERBOSE;\n\n-- 4. Tune Postgres configuration dynamically to prevent recurring lag\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2;\nSELECT pg_reload_conf();",
    "verification": "Execute `SELECT datname, age(datfrozenxid) FROM pg_database;` and verify that the transaction age of the active database drops from near 2 billion down to less than 10 million transactions.",
    "date": "2026-07-19",
    "id": 1784425645,
    "type": "error"
});