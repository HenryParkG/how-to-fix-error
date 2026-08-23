window.onPostDataLoaded({
    "title": "Fix Postgres XID Wraparound & Freeze Starvation",
    "slug": "fix-postgres-xid-wraparound-autovacuum-starvation",
    "language": "PostgreSQL",
    "code": "XIDWraparoundError",
    "tags": [
        "PostgreSQL",
        "Database",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on 32-bit transaction IDs (XIDs), providing approximately 4.29 billion transaction IDs. Because transaction comparisons are modulo $2^{31}$, any transaction older than 2.14 billion transactions in the past appears to be in the future, rendering data invisible or corrupting visibility maps. To prevent this, PostgreSQL triggers aggressive autovacuum freeze operations once a database approaches <code>autovacuum_freeze_max_age</code> (default 200 million transactions).</p><p>However, autovacuum freezing encounters starvation when blocked by long-running transactions, abandoned replication slots, orphaned prepared transactions, or heavily throttled I/O due to conservative <code>vacuum_cost_limit</code> settings. If <code>datfrozenxid</code> cannot advance past the critical threshold, PostgreSQL forcibly halts write operations and enters read-only emergency mode with errors like <code>ERROR: database is not accepting commands to avoid wraparound data loss</code>.</p>",
    "root_cause": "Unchecked long-running transactions, stale prepared transactions (2PC), or inactive replication slots prevent the global transaction horizon (OldestXID) from advancing, while default autovacuum cost throttle limits starve background freezing operations until emergency shutdown is reached.",
    "bad_code": "-- Default or misconfigured settings leading to autovacuum starvation\n-- postgresql.conf\nautovacuum_vacuum_cost_delay = 20ms\nautovacuum_vacuum_cost_limit = 200\nautovacuum_max_workers = 3\n\n-- Application query running indefinitely in uncommitted transaction\nBEGIN;\nSELECT * FROM orders WHERE status = 'PENDING' FOR UPDATE;\n-- Idle in transaction for days, holding OldestXID behind",
    "solution_desc": "Identify and terminate blocking backends, drop inactive replication slots, remove orphan prepared transactions, and configure aggressive autovacuum cost limits and freeze thresholds to allow background workers to catch up before entering fail-safe mode.",
    "good_code": "-- 1. Find and clear transactions blocking the XID horizon\nSELECT pid, age(backend_xmin), state, query \nFROM pg_stat_activity \nWHERE backend_xmin IS NOT NULL \nORDER BY age(backend_xmin) DESC LIMIT 5;\n\n-- 2. Drop abandoned replication slots holding xmin\nSELECT slot_name, active, xmin, catalog_xmin \nFROM pg_replication_slots \nWHERE active = false;\n-- SELECT pg_drop_replication_slot('abandoned_slot');\n\n-- 3. Tune autovacuum for aggressive freeze recovery (postgresql.conf / ALTER SYSTEM)\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 0;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 5000;\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_naptime = '15s';\nSELECT pg_reload_conf();\n\n-- 4. Manually trigger parallel aggressive freeze on affected table\nVACUUM (FREEZE, VERBOSE, PARALLEL 4) public.orders;",
    "verification": "Query `SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;` to confirm `age(datfrozenxid)` is decaying safely below 50,000,000. Inspect `pg_stat_progress_vacuum` to confirm active workers are advancing phases without being throttled.",
    "date": "2026-08-23",
    "id": 1787445837,
    "type": "error"
});