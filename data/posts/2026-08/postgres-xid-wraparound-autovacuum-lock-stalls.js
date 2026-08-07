window.onPostDataLoaded({
    "title": "Fixing PostgreSQL XID Wraparound Autovacuum Lock Stalls",
    "slug": "postgres-xid-wraparound-autovacuum-lock-stalls",
    "language": "PostgreSQL / C",
    "code": "XIDWraparoundStall",
    "tags": [
        "PostgreSQL",
        "Database",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 32-bit Transaction IDs (XIDs) to implement Multi-Version Concurrency Control (MVCC). Because XID values are finite, PostgreSQL periodically executes autovacuum worker processes to 'freeze' old tuples and prevent transaction ID wraparound.</p><p>Under heavy write traffic mixed with long-running transactions holding exclusive locks (such as dynamic schema migrations or explicit <code>SHARE UPDATE EXCLUSIVE</code> table locks), autovacuum workers trying to perform emergency anti-wraparound vacuums continuously block on lock acquisition. When the database approaches <code>autovacuum_freeze_max_age</code>, PostgreSQL forces aggressive autovacuum operations and rejects incoming write operations, causing severe database-wide connection stalls and outages.</p>",
    "root_cause": "Heavy explicit locks or unconstrained idle-in-transaction sessions hold back the global `oldest_xmin` horizon. This blocks autovacuum from freezing tuples on active tables. Once table age exceeds `autovacuum_freeze_max_age`, PostgreSQL escalates autovacuum workers into aggressive, un-throttled anti-wraparound mode which stalls user queries waiting on lock acquisition.",
    "bad_code": "-- Risky PostgreSQL configuration susceptible to lock starvation stalls\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- Application query running without lock or transaction timeout:\nBEGIN;\nLOCK TABLE high_throughput_events IN SHARE UPDATE EXCLUSIVE MODE;\n-- Long-running batch compute operations running inside transaction...\n-- Keeps transaction open for hours, blocking autovacuum freeze worker\nCOMMIT;",
    "solution_desc": "Mitigate lock contention by enabling automatic session timeouts for idle transactions, configuring aggressive failsafe vacuum parameters, increasing autovacuum cost limits, and applying custom storage settings for high-churn tables to initiate background freezing before forced emergency threshold limits are reached.",
    "good_code": "-- 1. Set global safety timeouts to prevent blocked autovacuum workers\nALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';\nALTER SYSTEM SET lock_timeout = '10s';\n\n-- 2. Scale cost limits to let autovacuum run faster under load\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET vacuum_failsafe_age = 1600000000;\n\n-- 3. Configure proactive anti-wraparound settings on high-churn tables\nALTER TABLE high_throughput_events SET (\n    autovacuum_vacuum_scale_factor = 0.05,\n    autovacuum_freeze_max_age = 50000000,\n    autovacuum_freeze_min_age = 10000000\n);\n\nSELECT pg_reload_conf();",
    "verification": "Query `pg_stat_activity` and `pg_database` to monitor transaction ages: `SELECT datname, age(datfrozenxid) FROM pg_database;`. Ensure `age(datfrozenxid)` remains low without spike occurrences under peak workload.",
    "date": "2026-08-07",
    "id": 1786078096,
    "type": "error"
});