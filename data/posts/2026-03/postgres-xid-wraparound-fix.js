window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-xid-wraparound-fix",
    "language": "SQL",
    "code": "XidWraparound",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the XID counter reaches approximately 2 billion, the database must 'wrap around' to prevent older transactions from appearing as if they occurred in the future. If autovacuum cannot keep up with high write volumes, the system reaches the 'autovacuum_freeze_max_age' limit and may shut down or go into read-only mode to prevent data corruption.</p>",
    "root_cause": "Autovacuum is too slow to freeze old tuples, often due to aggressive throttling or insufficient maintenance workers in high-throughput clusters.",
    "bad_code": "-- Default sub-optimal settings for high-write clusters\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_max_workers = 3;\n-- Result: Vacuuming takes too long, XID ages increase.",
    "solution_desc": "Tune autovacuum parameters to be more aggressive. Increase the cost limit to reduce throttling, allocate more memory for maintenance tasks, and manually trigger a VACUUM FREEZE on the oldest tables to clear the XID backlog.",
    "good_code": "-- Optimized settings for high-write clusters\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_work_mem = '1GB';\nALTER SYSTEM SET maintenance_work_mem = '2GB';\n-- Manually freeze the most critical table\nVACUUM (FREEZE, VERBOSE, ANALYZE) high_volume_table;",
    "verification": "Run 'SELECT datname, age(datfrozenxid) FROM pg_database;' and verify the age is decreasing.",
    "date": "2026-03-11",
    "id": 1773203299,
    "type": "error"
});