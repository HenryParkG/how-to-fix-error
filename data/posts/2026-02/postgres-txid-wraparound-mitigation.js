window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-mitigation",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the XID counter reaches roughly 2 billion, the database must 'wrap around'. If old tuples are not marked as 'frozen', they become invisible to new transactions, leading to data loss or database shutdown to prevent corruption. In high-throughput clusters, autovacuum may not trigger fast enough to freeze tuples before the threshold is reached.</p>",
    "root_cause": "High write volume outpacing the autovacuum freeze process, often exacerbated by long-running transactions or misconfigured autovacuum parameters.",
    "bad_code": "-- Default settings often too conservative for 10k+ TPS\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;",
    "solution_desc": "Increase the frequency and aggressiveness of autovacuum by lowering the freeze age and increasing the cost limit. Monitor 'age(relfrozenxid)' for all tables to identify lagging cleanup.",
    "good_code": "ALTER SYSTEM SET autovacuum_freeze_max_age = 500000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_max_workers = 10;\n-- Monitor query:\nSELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r' ORDER BY age(relfrozenxid) DESC;",
    "verification": "Run the monitor query and ensure 'age(relfrozenxid)' stays well below 'autovacuum_freeze_max_age' during peak load.",
    "date": "2026-02-28",
    "id": 1772240871,
    "type": "error"
});