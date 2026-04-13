window.onPostDataLoaded({
    "title": "Resolving PostgreSQL XID Wraparound Failures",
    "slug": "postgres-xid-wraparound-fix",
    "language": "SQL",
    "code": "XID Exhaustion",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system, allowing for approximately 2.1 billion transactions before the counter wraps around. If old transaction IDs are not 'frozen' via vacuuming before this limit is reached, the database will refuse to accept new commands to prevent data loss or corruption. In high-throughput clusters, the default autovacuum settings often fail to keep pace with the rate of XID consumption, leading to emergency shutdowns.</p>",
    "root_cause": "The autovacuum process is not aggressive enough or is being blocked by long-running transactions, preventing it from advancing the relfrozenxid for tables before reaching the autovacuum_freeze_max_age threshold.",
    "bad_code": "-- Default settings often insufficient for high-write loads\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Manually trigger a cluster-wide vacuum in a controlled maintenance window and tune autovacuum parameters to be more aggressive. Increase worker count and reduce cost delays to ensure the freezer keeps up with the transaction rate.",
    "good_code": "-- Aggressive tuning for high-throughput\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_freeze_max_age = 500000000;\nVACUUM FREEZE ANALYZE;",
    "verification": "Run 'SELECT datname, age(datfrozenxid) FROM pg_database;' to ensure the age of the oldest transaction is trending downward.",
    "date": "2026-04-13",
    "id": 1776058413,
    "type": "error"
});