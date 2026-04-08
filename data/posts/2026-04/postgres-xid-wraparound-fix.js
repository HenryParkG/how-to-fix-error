window.onPostDataLoaded({
    "title": "Fixing PostgreSQL XID Wraparound in High-Write DBs",
    "slug": "postgres-xid-wraparound-fix",
    "language": "SQL / Postgres",
    "code": "Transaction ID Exhaustion",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) for MVCC concurrency. When the XID counter approaches 2 billion, the database must 'freeze' old transactions to prevent wraparound, which would make old data appear to be in the future (and thus invisible). In high-write production environments, if the autovacuum process cannot keep up with XID consumption, the database will eventually enter read-only mode to protect data integrity.</p><p>This often happens due to misconfigured vacuum parameters or long-running transactions (e.g., forgotten IDE connections) holding back the 'Oldest XID'.</p>",
    "root_cause": "Autovacuum is tuned too conservatively for write volume, or long-standing idle transactions/orphaned replication slots prevent the vacuum from advancing the relfrozenxid.",
    "bad_code": "-- Default settings often too slow for 10k+ writes/sec\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_max_workers = 3;",
    "solution_desc": "1. Identify and kill long-running transactions. 2. Aggressively tune autovacuum to run faster and more frequently. 3. Increase maintenance_work_mem to allow vacuum to process more dead tuples per pass. 4. Manually trigger a VACUUM FREEZE on the most problematic tables.",
    "good_code": "-- Tune for high-throughput XID freezing\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET maintenance_work_mem = '1GB';\n-- Find transactions blocking XID cleanup\nSELECT pid, now() - xact_start AS duration, query \nFROM pg_stat_activity \nWHERE backend_xid IS NOT NULL ORDER BY 2 DESC;",
    "verification": "Run `SELECT datname, age(datfrozenxid) FROM pg_database;`. The age should decrease significantly after tuning and manual vacuuming.",
    "date": "2026-04-08",
    "id": 1775624781,
    "type": "error"
});