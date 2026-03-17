window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound Stalls",
    "slug": "postgres-txid-wraparound-stalls",
    "language": "SQL",
    "code": "DB Halt",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 32-bit Transaction IDs (TXIDs). When the global counter approaches 2 billion transactions, the system must 'freeze' old tuples to prevent them from becoming invisible due to counter wraparound. If autovacuum cannot keep up with the write rate, PostgreSQL eventually enters a safety 'read-only' mode to prevent data corruption.</p><p>In write-heavy clusters, this manifests as a sudden stall where all INSERT/UPDATE/DELETE operations fail with 'database is not accepting commands'.</p>",
    "root_cause": "The 'autovacuum_freeze_max_age' threshold is reached because autovacuum workers are throttled or insufficient, preventing TXID recycling.",
    "bad_code": "-- Default slow settings for high-write loads\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_max_workers = 3;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Tune autovacuum to be more aggressive and increase the cost limit so workers aren't paused as frequently. Manually trigger a VACUUM FREEZE on the oldest tables identified via pg_database metadata.",
    "good_code": "-- Aggressive settings to prevent wraparound\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET maintenance_work_mem = '1GB';\n-- Manual fix for specific database\nVACUUM FREEZE VERBOSE;",
    "verification": "Query 'SELECT datname, age(datfrozenxid) FROM pg_database;' to ensure age is well below 200 million.",
    "date": "2026-03-17",
    "id": 1773740768,
    "type": "error"
});