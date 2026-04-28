window.onPostDataLoaded({
    "title": "PostgreSQL: Preventing Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-prevention",
    "language": "SQL",
    "code": "TXID Wraparound",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system, which has a capacity of approximately 4 billion transactions. To manage visibility, half of these are 'in the past' and half 'in the future'. In high-velocity environments\u2014such as event logging or high-frequency trading\u2014the XID counter can advance so rapidly that it 'wraps around', making old data appear to be in the future and thus invisible. This eventually triggers a database shutdown to prevent data corruption.</p>",
    "root_cause": "The autovacuum process fails to keep up with the rate of XID consumption, or long-running transactions prevent the freezing of old tuples, causing the 'Age' of the database to exceed the freeze threshold.",
    "bad_code": "-- Default settings often insufficient for high-load\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- Long running transaction blocking vacuum\nBEGIN;\nSELECT * FROM logs; -- Left open for hours",
    "solution_desc": "Tune autovacuum to be more aggressive, implement table partitioning to drop old data quickly, and monitor the 'age' of the oldest transaction ID using system views.",
    "good_code": "-- Increase autovacuum workers and reduce cost delay\nALTER SYSTEM SET autovacuum_max_workers = 6;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\n-- Monitor XID age\nSELECT datname, age(datfrozenxid) FROM pg_database;",
    "verification": "Monitor `pg_database.datfrozenxid`. The age should consistently stay below 150 million after tuning under high load.",
    "date": "2026-04-28",
    "id": 1777373738,
    "type": "error"
});