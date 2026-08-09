window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Transaction ID Wraparound Lock Contention",
    "slug": "fixing-postgresql-xid-wraparound-lock-contention",
    "language": "PostgreSQL",
    "code": "Lock Contention",
    "tags": [
        "PostgreSQL",
        "Database",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction identifier (XID) system, offering ~4.2 billion distinct transaction IDs. To maintain MVCC visibility, rows are frozen as transaction IDs approach the 2-billion limit. When a database's oldest unfrozen XID reaches <code>autovacuum_freeze_max_age</code>, PostgreSQL triggers an aggressive, non-cancelable autovacuum worker to prevent transaction ID wraparound data corruption.</p><p>Under sustained heavy write traffic, standard background autovacuum settings fall behind. When emergency wraparound autovacuum engages, it scans entire tables while holding aggressive page-level cleanup locks, causing heavy I/O spikes and blocking concurrent updates/inserts. This results in severe lock contention, query timeouts, and elevated connection spikes across the application cluster.</p>",
    "root_cause": "Autovacuum default settings (autovacuum_vacuum_cost_limit, scale factors, and max_workers) were too conservative for high-write tables, causing relation age to hit autovacuum_freeze_max_age and triggering blocking emergency freezes.",
    "bad_code": "-- Outdated global defaults in postgresql.conf under write-heavy loads\nautovacuum_vacuum_scale_factor = 0.2\nautovacuum_vacuum_cost_limit = 200\nautovacuum_max_workers = 3\nautovacuum_naptime = 1min\n\n-- Checking age reveals critical XID danger\nSELECT c.relname, age(c.relfrozenxid)\nFROM pg_class c\nWHERE c.relkind = 'r' AND age(c.relfrozenxid) > 150000000;",
    "solution_desc": "Tune autovacuum to run continuously and aggressively in the background using custom storage parameters on high-throughput tables. Lower `autovacuum_vacuum_scale_factor`, increase `autovacuum_vacuum_cost_limit` to eliminate cost throttling, and lower `autovacuum_freeze_max_age` to trigger smaller, routine freeze passes instead of giant emergency blockages.",
    "good_code": "-- Increase cost limit globally to eliminate I/O throttling during freeze\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_max_workers = 8;\nSELECT pg_reload_conf();\n\n-- Aggressively tune specific high-write tables to freeze tuples incrementally\nALTER TABLE heavily_updated_table SET (\n    autovacuum_vacuum_scale_factor = 0.02,\n    autovacuum_vacuum_threshold = 10000,\n    autovacuum_freeze_max_age = 50000000,\n    autovacuum_vacuum_cost_limit = 3000\n);",
    "verification": "Monitor `age(relfrozenxid)` using `SELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r';` and verify that the age remains well below 50,000,000 without causing lock spikes in `pg_stat_activity`.",
    "date": "2026-08-09",
    "id": 1786248652,
    "type": "error"
});