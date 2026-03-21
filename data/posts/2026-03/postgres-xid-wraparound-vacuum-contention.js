window.onPostDataLoaded({
    "title": "Resolving PostgreSQL XID Wraparound Errors",
    "slug": "postgres-xid-wraparound-vacuum-contention",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the transaction counter reaches approximately 2 billion, the system risks 'wraparound' where old transactions appear to be in the future. To prevent data loss, PostgreSQL enters a safety-critical read-only mode when the gap between the oldest and newest transaction becomes too large.</p><p>This often happens under heavy vacuum contention, where autovacuum workers cannot keep up with the write load or are blocked by long-running transactions (idle-in-transaction) or orphaned replication slots.</p>",
    "root_cause": "The autovacuum process is unable to 'freeze' old tuples fast enough to stay ahead of the transaction ID consumption rate.",
    "bad_code": "-- Default settings often too conservative for high-write loads\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_max_workers = 3;",
    "solution_desc": "Tune autovacuum settings to be more aggressive, kill long-running transactions that block the freeze horizon, and manually run VACUUM FREEZE on high-churn tables.",
    "good_code": "-- Increase maintenance work memory and vacuum intensity\nALTER SYSTEM SET maintenance_work_mem = '1GB';\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- Identify blocking transactions\nSELECT pid, age(backend_xid) FROM pg_stat_activity WHERE state <> 'idle' ORDER BY age DESC;",
    "verification": "Monitor 'age(datfrozenxid)' from the pg_database table; it should decrease significantly after a successful freeze.",
    "date": "2026-03-21",
    "id": 1774085039,
    "type": "error"
});