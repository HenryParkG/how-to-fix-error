window.onPostDataLoaded({
    "title": "Resolving PostgreSQL XID Wraparound in High-Load Clusters",
    "slug": "postgresql-xid-wraparound-resolution",
    "language": "SQL",
    "code": "TransactionIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL utilizes a 32-bit transaction ID (XID) system. When the transaction counter reaches approximately 2.1 billion, it wraps around to zero. To maintain data visibility, PostgreSQL uses 'freezing' to mark old transactions as permanent. In high-throughput clusters, if the <code>autovacuum</code> process cannot keep up with the rate of new transactions, the gap between the oldest unfrozen XID and the current XID closes. When this reaches a critical threshold (<code>autovacuum_freeze_max_age</code>), the database enters a protective read-only mode, causing severe downtime.</p>",
    "root_cause": "The autovacuum worker is throttled by default cost-limiting settings, preventing it from completing 'aggressive' vacuums fast enough to freeze XIDs before the 2-billion transaction limit is approached.",
    "bad_code": "-- Default settings often insufficient for 10k+ TPS\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- This leads to workers sleeping too often while the XID age grows.",
    "solution_desc": "Increase the autovacuum resource allocation and lower the freeze min age to trigger background freezing earlier. If already in a critical state, perform a manual vacuum of the oldest tables in a maintenance window with cost limiting disabled.",
    "good_code": "-- Tuning for High Throughput\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000; \nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.01;\nALTER SYSTEM SET autovacuum_freeze_max_age = 500000000;\n\n-- Emergency Manual Freeze (Run per table)\nSET vacuum_cost_limit = 0; \nVACUUM FREEZE VERBOSE high_volume_table;",
    "verification": "Monitor XID age using: SELECT datname, age(datfrozenxid) FROM pg_database; Ensure the age trends downward after tuning.",
    "date": "2026-03-03",
    "id": 1772530403,
    "type": "error"
});