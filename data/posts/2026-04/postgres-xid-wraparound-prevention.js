window.onPostDataLoaded({
    "title": "Preventing PostgreSQL XID Wraparound in High-Write Clusters",
    "slug": "postgres-xid-wraparound-prevention",
    "language": "SQL / Go",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. In high-throughput environments, the 2-billion transaction limit can be reached quickly. If the autovacuum process cannot 'freeze' old rows fast enough, the database will reach a critical threshold and shut down into read-only mode to prevent data corruption. This usually happens when long-running transactions block vacuuming or when vacuum settings are too conservative for the write load.</p>",
    "root_cause": "Autovacuum worker starvation or 'autovacuum_freeze_max_age' being set too high relative to the transaction burn rate.",
    "bad_code": "-- Default settings often too slow for 50k+ TPS\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; \nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Tune autovacuum to be more aggressive by reducing scale factors and increasing the worker count. Additionally, implement monitoring for 'age(datfrozenxid)' to trigger manual vacuums before the safety limit is reached.",
    "good_code": "ALTER SYSTEM SET autovacuum_max_workers = 10;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.02;\nALTER SYSTEM SET autovacuum_freeze_max_age = 100000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;",
    "verification": "Run 'SELECT datname, age(datfrozenxid) FROM pg_database;' and ensure the age is consistently decreasing after vacuum cycles.",
    "date": "2026-04-03",
    "id": 1775199547,
    "type": "error"
});