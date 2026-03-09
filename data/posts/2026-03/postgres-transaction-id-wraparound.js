window.onPostDataLoaded({
    "title": "Resolving PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-transaction-id-wraparound",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Database",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the counter reaches approximately 2.1 billion, it wraps around. If old transactions are not 'frozen' (marked as visible to all future transactions) via the VACUUM process, the database will eventually refuse to accept new writes to prevent data loss or 'anti-wraparound' corruption.</p><p>In high-throughput systems, the autovacuum daemon might not keep pace with the rate of XID consumption.</p>",
    "root_cause": "Autovacuum failing to reach tables before their oldest XID reaches the 'autovacuum_freeze_max_age' threshold.",
    "bad_code": "-- Default settings often too conservative for high-write loads\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- Long running transactions block cleanup\nSELECT * FROM pg_stat_activity WHERE state != 'idle' AND query_start < now() - interval '1 hour';",
    "solution_desc": "Aggressively tune autovacuum parameters and manually trigger a VACUUM FREEZE on the oldest tables. Monitor XID age regularly.",
    "good_code": "-- Tune for faster cleanup\nALTER TABLE large_table SET (autovacuum_vacuum_scale_factor = 0.01);\n-- Manual emergency freeze\nVACUUM FREEZE VERBOSE analytics_table;",
    "verification": "Execute `SELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r' ORDER BY age(relfrozenxid) DESC;` to ensure ages are decreasing.",
    "date": "2026-03-09",
    "id": 1773049191,
    "type": "error"
});