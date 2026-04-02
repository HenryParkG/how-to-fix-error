window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL XID Wraparound in High-Write DBs",
    "slug": "postgres-xid-wraparound-fix",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the counter reaches ~2 billion, it wraps around. If 'frozen' tuples are not created via vacuuming before this happens, old data becomes invisible or 'future' data, leading to catastrophic data loss. In high-write clusters, autovacuum often fails to keep up, leading to a forced shutdown where the DB refuses to start until a single-user mode vacuum is performed.</p>",
    "root_cause": "The autovacuum process is throttled by default settings ('autovacuum_vacuum_cost_limit'), and long-running transactions or orphaned replication slots prevent vacuum from cleaning up old transaction IDs.",
    "bad_code": "-- Default settings that lead to wraparound in high-load environments\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; -- Too slow for billion-row tables\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000; -- Default is often too risky\n-- Also: Long running transactions\nSELECT pid, query FROM pg_stat_activity WHERE state != 'idle' AND backend_start < now() - interval '1 day';",
    "solution_desc": "Tune autovacuum to be more aggressive and monitor the age of the oldest transaction. Specifically, increase the cost limit and decrease the scale factor so vacuuming starts sooner and runs faster. Additionally, implement a kill-switch for long-running transactions.",
    "good_code": "-- Tune for high throughput\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.01;\nALTER SYSTEM SET autovacuum_freeze_max_age = 500000000;\n-- Monitor query\nSELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;\n-- Kill idle transactions older than 5 mins\nSET idle_in_transaction_session_timeout = '300s';",
    "verification": "Run 'SELECT age(relfrozenxid) FROM pg_class WHERE relkind = 'r'' and verify that no table has an age approaching the freeze_max_age.",
    "date": "2026-04-02",
    "id": 1775092981,
    "type": "error"
});