window.onPostDataLoaded({
    "title": "Resolving PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-transaction-id-wraparound",
    "language": "SQL",
    "code": "XID Wraparound",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit Transaction ID (XID) system. When the transaction counter reaches approximately 2 billion, the database risks 'wraparound,' where old transactions appear to be in the future, causing data loss or corruption. To prevent this, Postgres triggers a 'wraparound fail-safe' by going into read-only mode. In high-write environments, this usually happens because autovacuum cannot keep up with the 'freeze' process, often blocked by long-running transactions or abandoned replication slots.</p>",
    "root_cause": "Autovacuum failing to freeze old tuples due to long-running transactions (LRTs) or improper vacuum throttling settings.",
    "bad_code": "-- Risky configuration for high-write DBs\nALTER TABLE large_table SET (autovacuum_enabled = false);\n-- OR allowing long transactions to linger\nBEGIN; -- and forgetting to COMMIT for 48 hours",
    "solution_desc": "Aggressively tune autovacuum settings to freeze tuples more frequently. Identify and terminate long-running transactions. Increase 'maintenance_work_mem' to speed up the vacuum process and lower 'autovacuum_freeze_max_age'.",
    "good_code": "-- Tune table for aggressive freezing\nALTER TABLE orders SET (\n  autovacuum_vacuum_scale_factor = 0.01,\n  autovacuum_freeze_max_age = 100000000,\n  autovacuum_vacuum_cost_limit = 1000\n);\n-- Monitor age: SELECT datname, age(datfrozenxid) FROM pg_database;",
    "verification": "Query 'pg_database' to ensure the 'age(datfrozenxid)' is decreasing after manual VACUUM FREEZE.",
    "date": "2026-05-04",
    "id": 1777882689,
    "type": "error"
});