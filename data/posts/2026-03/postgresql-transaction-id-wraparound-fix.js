window.onPostDataLoaded({
    "title": "Resolving PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-transaction-id-wraparound-fix",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. Because this space is finite (approx. 4 billion), the database must 'freeze' old transaction IDs to recycle them. If the autovacuum process cannot keep up with high write volumes or is blocked by long-running transactions, the system reaches a critical threshold. Once the age of the oldest XID reaches 2 billion, PostgreSQL enters read-only mode to prevent data corruption, effectively taking the application offline.</p>",
    "root_cause": "Autovacuum failing to freeze old tuples due to restrictive configuration, long-running transactions (idle in transaction), or heavy write pressure exceeding vacuum throughput.",
    "bad_code": "-- Configuration that is too conservative for high-write loads\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; -- Default 20% is too high for large tables\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Identify and terminate long-running transactions, then tune autovacuum to be more aggressive by reducing scale factors and increasing cost limits. Finally, manually trigger a VACUUM FREEZE on the oldest tables.",
    "good_code": "-- 1. Find the oldest databases\nSELECT datname, age(datfrozenxid) FROM pg_database ORDER BY age(datfrozenxid) DESC;\n\n-- 2. Tune for faster vacuuming\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.01; \nSELECT pg_reload_conf();\n\n-- 3. Manually freeze the table\nVACUUM FREEZE VERBOSE my_large_skewed_table;",
    "verification": "Monitor 'pg_database.datfrozenxid' age. Ensure it decreases significantly below the 'autovacuum_freeze_max_age' threshold.",
    "date": "2026-03-06",
    "id": 1772789457,
    "type": "error"
});