window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-fix",
    "language": "SQL",
    "code": "TXIDWraparound",
    "tags": [
        "SQL",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-write PostgreSQL clusters, the 32-bit Transaction ID (TXID) counter can reach its limit (2 billion transactions). If the system does not 'freeze' old tuples via vacuuming, it reaches a 'wraparound' state where the database stops accepting commands to prevent data loss. This is catastrophic for production systems as it requires a forced single-user mode vacuum which can take hours or days on multi-terabyte datasets.</p>",
    "root_cause": "Autovacuum settings being too conservative, preventing the background workers from keeping up with the rate of TXID consumption and failing to reach the 'freeze' threshold for old data pages.",
    "bad_code": "-- Default settings often insufficient for 10k+ TPS\nALTER SYSTEM SET autovacuum_max_workers = 3;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Increase autovacuum throughput by increasing worker count, decreasing scale factors to trigger vacuuming sooner, and significantly increasing the cost limit to allow workers to use more I/O.",
    "good_code": "-- Aggressive autovacuum tuning for high-volume clusters\nALTER SYSTEM SET autovacuum_max_workers = 10;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.02;\nALTER SYSTEM SET autovacuum_freeze_max_age = 500000000;\n-- Manually freeze a specific high-churn table\nVACUUM FREEZE VERBOSE heavy_write_table;",
    "verification": "Check the age of the oldest transaction ID using: `SELECT datname, age(datfrozenxid) FROM pg_database;`. The age should significantly decrease after the fix.",
    "date": "2026-05-16",
    "id": 1778910390,
    "type": "error"
});