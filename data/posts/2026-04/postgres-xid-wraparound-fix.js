window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID (XID) Wraparound",
    "slug": "postgres-xid-wraparound-fix",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) counter. If the difference between the oldest frozen XID and the current XID reaches 2 billion, the database enters a read-only safety mode to prevent data corruption. In high-write clusters, autovacuum may fail to keep up.</p>",
    "root_cause": "Long-running transactions or abandoned replication slots preventing autovacuum from freezing old rows and advancing the 'datfrozenxid' counter.",
    "bad_code": "-- Ignoring autovacuum health or keeping transactions open\nBEGIN;\nSELECT * FROM large_table; -- Keeping this open for hours",
    "solution_desc": "Tune autovacuum settings to be more aggressive and terminate long-running idle transactions. Manually run VACUUM FREEZE on the most problematic tables.",
    "good_code": "-- Tune autovacuum for high-write tables\nALTER TABLE high_traffic_table SET (\n  autovacuum_vacuum_scale_factor = 0.01,\n  autovacuum_vacuum_cost_limit = 1000\n);\n-- Monitor age\nSELECT datname, age(datfrozenxid) FROM pg_database;",
    "verification": "Query pg_database and verify that the age(datfrozenxid) for all databases is significantly below 200 million.",
    "date": "2026-04-25",
    "id": 1777110201,
    "type": "error"
});