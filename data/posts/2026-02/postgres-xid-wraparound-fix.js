window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Transaction ID (XID) Wraparound",
    "slug": "postgres-xid-wraparound-fix",
    "language": "SQL",
    "code": "XID Wraparound",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit integer for Transaction IDs (XIDs), providing roughly 4 billion IDs. When the counter approaches this limit, the database must 'freeze' old transactions to reuse IDs. If high write volume outpaces the Autovacuum process, the database will eventually shut down and enter read-only mode to prevent data corruption, a state known as XID Wraparound failure.</p>",
    "root_cause": "Autovacuum settings are too conservative for high-write workloads, preventing the background process from cleaning and freezing tuples fast enough.",
    "bad_code": "autovacuum_vacuum_scale_factor = 0.2\nautovacuum_freeze_max_age = 200000000",
    "solution_desc": "Tune autovacuum to trigger more aggressively by reducing the scale factor and increasing the vacuum cost limit. Manually run VACUUM FREEZE on the largest tables if the age is critical.",
    "good_code": "ALTER TABLE large_table SET (autovacuum_vacuum_scale_factor = 0.01);\nSET autovacuum_vacuum_cost_limit = 1000;",
    "verification": "Run 'SELECT datname, age(datfrozenxid) FROM pg_database;' and ensure the age is decreasing toward 0.",
    "date": "2026-02-19",
    "id": 1771476493,
    "type": "error"
});