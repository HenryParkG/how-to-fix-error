window.onPostDataLoaded({
    "title": "Preventing PostgreSQL Transaction ID (XID) Wraparound",
    "slug": "postgres-xid-wraparound-prevention",
    "language": "SQL",
    "code": "ERROR: database is not accepting commands",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 32-bit transaction IDs, allowing for roughly 4 billion transactions. To manage visibility, it uses a circular buffer. If a system reaches the 'wraparound' point without 'freezing' old transaction IDs, the database enters read-only mode to prevent data corruption. This is a critical failure in high-write environments where autovacuum cannot keep up.</p>",
    "root_cause": "Long-running transactions, orphaned replication slots, or misconfigured autovacuum settings prevent the 'vacuum' process from advancing the 'relfrozenxid' of tables.",
    "bad_code": "ALTER SYSTEM SET autovacuum_freeze_max_age = 2000000000; -- Dangerously high\n# Also: Leaving a transaction open for days\nBEGIN;\nSELECT * FROM large_table; -- Forgotten connection",
    "solution_desc": "Tune autovacuum to be more aggressive by increasing its cost limit and decreasing the scale factor. Monitor the age of the oldest transaction ID using system views and manually run VACUUM FREEZE on problematic tables during maintenance windows.",
    "good_code": "ALTER TABLE high_volume_table SET (autovacuum_vacuum_scale_factor = 0.01);\nSELECT datname, age(datfrozenxid) FROM pg_database ORDER BY age(datfrozenxid) DESC;",
    "verification": "Query 'pg_database' to ensure 'age(datfrozenxid)' is significantly below 200 million and decreasing after vacuuming.",
    "date": "2026-04-20",
    "id": 1776680876,
    "type": "error"
});