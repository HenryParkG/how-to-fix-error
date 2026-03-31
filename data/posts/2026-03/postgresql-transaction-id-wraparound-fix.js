window.onPostDataLoaded({
    "title": "Resolving PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-transaction-id-wraparound-fix",
    "language": "PostgreSQL",
    "code": "XID Wraparound",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the counter approaches 2 billion transactions, the system must 'freeze' old rows to avoid wraparound, which would make old data appear as if it's in the future and thus invisible. Under high concurrency, autovacuum often stalls because it is interrupted by heavy writes or blocked by long-running transactions (or orphaned replication slots). If the threshold is reached, Postgres enters a forced read-only mode to prevent data corruption.</p>",
    "root_cause": "Autovacuum is unable to freeze old tuples because of long-running transactions, orphaned replication slots, or insufficient autovacuum worker resources.",
    "bad_code": "-- Identify blockers\nSELECT pid, query, state, age(now(), query_start) \nFROM pg_stat_activity \nWHERE state != 'idle' ORDER BY age DESC;\n\n-- Checking XID age\nSELECT datname, age(datfrozenxid) FROM pg_database;",
    "solution_desc": "Terminate long-running idle transactions, drop unused replication slots, and tune autovacuum settings (cost limit and scale factor) to be more aggressive in freezing tuples.",
    "good_code": "ALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_max_workers = 10;\n-- Drop old slots\nSELECT pg_drop_replication_slot('unused_slot');\n-- Force vacuum freeze on critical table\nVACUUM FREEZE VERBOSE heavy_write_table;",
    "verification": "Run 'SELECT age(datfrozenxid) FROM pg_database' and ensure the age is significantly decreasing.",
    "date": "2026-03-31",
    "id": 1774940591,
    "type": "error"
});