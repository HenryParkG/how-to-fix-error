window.onPostDataLoaded({
    "title": "Fixing Postgres Transaction ID Wraparound Stalls",
    "slug": "postgres-txid-wraparound-fix",
    "language": "SQL",
    "code": "TXIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>In high-write PostgreSQL clusters, the Transaction ID (XID) counter can approach the 2-billion limit. When the age of the oldest transaction reaches <code>autovacuum_freeze_max_age</code>, the database enters a forced 'wraparound prevention' mode. If this fails to clear the backlog, the database may stop accepting writes entirely to prevent data corruption, resulting in significant downtime.</p>",
    "root_cause": "Autovacuum worker starvation or misconfiguration preventing the freezing of old tuples, coupled with long-running transactions holding back the 'oldest Xmin'.",
    "bad_code": "-- Current settings are too conservative for high volume\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_max_workers = 3;",
    "solution_desc": "Identify and kill long-running transactions, then aggressively tune autovacuum parameters to increase throughput. Manual VACUUM FREEZE on the oldest tables is often required to recover from a stall.",
    "good_code": "-- Tune for aggressive recovery\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.01;\nVACUUM FREEZE VERBOSE heavy_table_name;",
    "verification": "Monitor `select datname, age(datfrozenxid) from pg_database;` and ensure age is decreasing.",
    "date": "2026-03-24",
    "id": 1774345577,
    "type": "error"
});