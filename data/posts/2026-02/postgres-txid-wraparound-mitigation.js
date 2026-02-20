window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-mitigation",
    "language": "SQL",
    "code": "TXID Exhaustion",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 32-bit transaction IDs (TXIDs). Because these IDs are finite (~4 billion), the database must 'freeze' old transaction IDs to recycle them. In high-write volume clusters, if the autovacuum process cannot keep up with the rate of new transactions, the database will eventually reach the 'wraparound' threshold. At this point, PostgreSQL forces a shutdown to prevent data corruption, as new transactions would overlap with old, unfrozen ones.</p>",
    "root_cause": "The autovacuum worker is throttled by default or blocked by long-running transactions/orphaned prepared transactions, preventing the 'relfrozenxid' (the horizon of frozen transactions) from advancing.",
    "bad_code": "-- Default settings often insufficient for 10k+ writes/sec\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; -- 20% is too high for large tables\nALTER SYSTEM SET autovacuum_cost_limit = 200; -- Too slow for high-write loads",
    "solution_desc": "Lower the autovacuum scale factors to trigger vacuuming more frequently on large tables and increase the cost limit to allow vacuuming to work faster. Additionally, identify and terminate long-standing idle transactions that block the frozen horizon.",
    "good_code": "-- Aggressive autovacuum tuning for high-volume clusters\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.01;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_max_workers = 10;\n\n-- Query to find tables closest to wraparound:\nSELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r' ORDER BY 2 DESC LIMIT 10;",
    "verification": "Monitor the 'age(relfrozenxid)' for all tables. The value should stay well below 200 million. Use Prometheus pg_stat_activity metrics to alert when any table age exceeds 500 million.",
    "date": "2026-02-20",
    "id": 1771580109,
    "type": "error"
});