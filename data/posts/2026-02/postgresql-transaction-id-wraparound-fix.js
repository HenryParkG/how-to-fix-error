window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-transaction-id-wraparound-fix",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 32-bit transaction IDs (XIDs). When the counter reaches 2 billion, the database must 'wrap around'. If old transactions aren't 'frozen' via VACUUM, the database enters read-only mode to prevent data corruption. In high-transaction clusters, autovacuum may not keep up, leading to imminent downtime.</p>",
    "root_cause": "The relfrozenxid of a table lags too far behind the current XID because autovacuum workers are too slow, being throttled, or blocked by long-running transactions.",
    "bad_code": "-- Current settings likely too conservative for high load:\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_cost_limit = 200;",
    "solution_desc": "Aggressively tune autovacuum parameters to trigger more frequent cleanups and increase the speed of the vacuum workers. Identify and kill long-running transactions or abandoned replication slots that block xmin advancement.",
    "good_code": "ALTER TABLE large_table SET (autovacuum_vacuum_scale_factor = 0.01);\nALTER SYSTEM SET autovacuum_cost_limit = 2000;\nALTER SYSTEM SET maintenance_work_mem = '2GB';\n-- Monitor with:\nSELECT datname, age(datfrozenxid) FROM pg_database;",
    "verification": "Monitor the 'age' of the oldest transaction ID using pg_database. If age(datfrozenxid) starts decreasing after a VACUUM FREEZE, the risk is mitigated.",
    "date": "2026-02-22",
    "id": 1771742238,
    "type": "error"
});