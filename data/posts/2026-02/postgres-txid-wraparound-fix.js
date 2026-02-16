window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-fix",
    "language": "SQL",
    "code": "Critical Failure",
    "tags": [
        "SQL",
        "Infra",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system, allowing for approximately 4 billion transactions. To manage this, it utilizes a circular buffer where IDs wrap around. When the difference between the oldest frozen transaction and the current XID reaches a critical threshold (usually 2 billion), the database enters a read-only safety mode to prevent data corruption. In high-throughput clusters, autovacuum often cannot keep up with the volume of writes, causing the <code>datfrozenxid</code> to age dangerously.</p>",
    "root_cause": "The autovacuum worker is throttled or incorrectly configured, preventing it from 'freezing' old tuples faster than new transaction IDs are consumed, eventually hitting the autovacuum_freeze_max_age limit.",
    "bad_code": "-- Default settings often too conservative for high-write loads\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; \nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Aggressively tune autovacuum parameters to trigger freezing more frequently and increase the throughput of the vacuum process by reducing cost-based delays.",
    "good_code": "-- Increase worker count and reduce cost delay to speed up freezing\nALTER SYSTEM SET autovacuum_max_workers = 6;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_freeze_max_age = 500000000;\n-- Target specific high-churn tables\nALTER TABLE high_volume_table SET (autovacuum_vacuum_scale_factor = 0.01);",
    "verification": "Monitor XID age using: SELECT datname, age(datfrozenxid) FROM pg_database WHERE datname = 'your_db';",
    "date": "2026-02-16",
    "id": 1771217705,
    "type": "error"
});