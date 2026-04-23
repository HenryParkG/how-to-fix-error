window.onPostDataLoaded({
    "title": "Eliminating PostgreSQL XID Wraparound in High-Write Clusters",
    "slug": "postgresql-transaction-id-wraparound-fix",
    "language": "SQL",
    "code": "XID Wraparound",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system, allowing for approximately 4 billion transactions. To manage visibility, half of these are in the 'past' and half in the 'future'. In high-velocity write environments, if the 'oldest' transaction is not 'frozen' via VACUUM before the 2-billion threshold is reached, the database enters a fail-safe read-only mode to prevent data corruption. This leads to immediate service outages in high-concurrency systems.</p>",
    "root_cause": "The autovacuum worker fails to keep up with the transaction burn rate because the default 'autovacuum_vacuum_scale_factor' (0.2) is too high for large tables, delaying the freezing process until the XID age reaches dangerous levels.",
    "bad_code": "ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- Default settings are insufficient for tables with 100M+ writes/day",
    "solution_desc": "Decrease the scale factor to trigger vacuuming more frequently on large tables and increase the autovacuum worker count and maintenance work memory to ensure the process completes faster. Manually tune 'vacuum_freeze_min_age' to lower thresholds.",
    "good_code": "ALTER TABLE large_transaction_table SET (\n  autovacuum_vacuum_scale_factor = 0.01,\n  autovacuum_freeze_min_age = 50000000,\n  autovacuum_vacuum_cost_limit = 1000\n);\n-- Monitor with: SELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r';",
    "verification": "Execute 'SELECT datname, age(datfrozenxid) FROM pg_database;' and ensure the age is consistently trending downwards after the configuration change.",
    "date": "2026-04-23",
    "id": 1776939345,
    "type": "error"
});