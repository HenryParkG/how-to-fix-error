window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-transaction-id-wraparound-fix",
    "language": "SQL",
    "code": "XIDWraparoundError",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system, limiting the total number of concurrent transactions to roughly 4 billion. When the XID counter approaches this limit, the database risks 'wraparound,' where old transactions appear to be in the future, leading to massive data corruption.</p><p>To prevent this, Postgres triggers a safety shutdown, moving the cluster into read-only mode once the 'autovacuum_freeze_max_age' threshold is reached.</p>",
    "root_cause": "The autovacuum process is not aggressive enough to keep up with high-write volumes, causing the 'age' of the oldest unvacuumed table to exceed the safety limit.",
    "bad_code": "-- Default settings often insufficient for high-write loads\nautovacuum_vacuum_scale_factor = 0.2\nautovacuum_freeze_max_age = 200000000\n# Transaction age monitoring query\nSELECT datname, age(datfrozenxid) FROM pg_database;",
    "solution_desc": "Tune autovacuum to run more frequently and with more resources. Lower the scale factor so vacuuming triggers earlier on large tables and increase the maintenance work memory to speed up the process.",
    "good_code": "-- Optimized postgresql.conf settings\nautovacuum_vacuum_scale_factor = 0.02\nautovacuum_vacuum_cost_limit = 1000\nmaintenance_work_mem = '1GB'\nautovacuum_freeze_max_age = 500000000\n\n-- Manual intervention for critical tables\nVACUUM FREEZE VERBOSE high_volume_table;",
    "verification": "Monitor the age of transactions using 'SELECT max(age(datfrozenxid)) FROM pg_database;'. The value should stay well below the freeze_max_age.",
    "date": "2026-04-11",
    "id": 1775890283,
    "type": "error"
});