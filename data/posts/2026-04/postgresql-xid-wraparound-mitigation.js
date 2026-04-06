window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound Risk",
    "slug": "postgresql-xid-wraparound-mitigation",
    "language": "SQL",
    "code": "XID Wraparound",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system, allowing for approximately 4 billion transactions. To manage visibility, it uses a circular buffer where IDs are compared. If the 'age' of the oldest transaction reaches 2 billion, the system risks 'wraparound' where old data suddenly becomes invisible. In sharded, write-intensive clusters, the autovacuum process often cannot keep up with the XID consumption rate, leading to emergency shutdowns to prevent data loss.</p>",
    "root_cause": "Autovacuum worker starvation and conservative default settings for 'autovacuum_freeze_max_age' in high-write-volume shards.",
    "bad_code": "-- Default settings in postgresql.conf\nautovacuum_freeze_max_age = 200000000\nautovacuum_max_workers = 3",
    "solution_desc": "Aggressively tune autovacuum parameters to trigger freezing earlier and increase worker throughput. Implement a monitoring alert for 'datfrozenxid' age.",
    "good_code": "ALTER SYSTEM SET autovacuum_freeze_max_age = 500000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\n-- For specific high-volume tables\nALTER TABLE large_orders SET (autovacuum_vacuum_scale_factor = 0.01);",
    "verification": "Run 'SELECT datname, age(datfrozenxid) FROM pg_database;' and ensure age stays consistently below 1 billion.",
    "date": "2026-04-06",
    "id": 1775469650,
    "type": "error"
});