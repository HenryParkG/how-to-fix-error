window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-mitigation",
    "language": "SQL",
    "code": "TXID_WRAPAROUND",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. Because the ID space is circular, a cluster can only handle roughly 2 billion transactions before IDs must be 'frozen' to prevent new transactions from appearing older than past ones. If the vacuum process fails to keep up with high-write volume, the database will eventually enter a read-only safety mode to prevent data corruption.</p>",
    "root_cause": "The autovacuum worker is not triggering frequently enough or is being throttled by cost limits, causing the oldest transaction ID (relfrozenxid) to approach the 2-billion-cycle horizon.",
    "bad_code": "ALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- Standard default is often too low for high-throughput DBs\n-- No monitoring for: SELECT datname, age(datfrozenxid) FROM pg_database;",
    "solution_desc": "Proactively tune autovacuum parameters to be more aggressive and increase the freeze max age to allow more breathing room, while ensuring the vacuum workers are not throttled by the vacuum_cost_limit.",
    "good_code": "ALTER SYSTEM SET autovacuum_freeze_max_age = 1000000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_work_mem = '1GB';\n-- Monitor with:\nSELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r' ORDER BY 2 DESC;",
    "verification": "Check 'pg_class.relfrozenxid' to ensure the age of the oldest table is decreasing after manual or automatic vacuuming.",
    "date": "2026-02-25",
    "id": 1771982508,
    "type": "error"
});