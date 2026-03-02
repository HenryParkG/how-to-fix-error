window.onPostDataLoaded({
    "title": "Mitigating Postgres Transaction ID Wraparound",
    "slug": "postgres-transaction-id-wraparound-mitigation",
    "language": "SQL",
    "code": "TXID_Wraparound",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the counter approaches 2 billion transactions, the system must 'freeze' old rows to prevent them from becoming invisible (appearing as if they were in the future). If the autovacuum process cannot keep up with high-write volumes, the cluster enters a 'read-only' safety mode to prevent data corruption.</p><p>This is a critical failure state that halts all application writes, often occurring during peak traffic or bulk data migrations.</p>",
    "root_cause": "The issue is caused by the autovacuum daemon being throttled or improperly configured, preventing it from advancing the 'relfrozenxid' for large, busy tables before the 'autovacuum_freeze_max_age' threshold is reached.",
    "bad_code": "-- Default settings risky for high-volume (10k+ TPS) clusters\nautovacuum_vacuum_scale_factor = 0.2\nautovacuum_freeze_max_age = 200000000",
    "solution_desc": "Lower the autovacuum scale factor to trigger cleanup more frequently, increase the 'autovacuum_vacuum_cost_limit' to reduce throttling, and manually trigger 'VACUUM FREEZE' on problematic tables during maintenance windows.",
    "good_code": "ALTER TABLE large_busy_table SET (autovacuum_vacuum_scale_factor = 0.01);\nSET autovacuum_freeze_max_age = 1000000000;\nSET autovacuum_vacuum_cost_limit = 1000;\n-- Monitor age\nSELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r' ORDER BY 2 DESC;",
    "verification": "Check 'pg_stat_activity' for active vacuum workers and monitor the 'age(relfrozenxid)' query results to ensure the horizon is receding.",
    "date": "2026-03-02",
    "id": 1772426657,
    "type": "error"
});