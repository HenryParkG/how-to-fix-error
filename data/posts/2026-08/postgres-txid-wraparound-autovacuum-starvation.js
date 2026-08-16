window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound Autovacuum Starvation",
    "slug": "postgres-txid-wraparound-autovacuum-starvation",
    "language": "PostgreSQL",
    "code": "TxidWraparoundError",
    "tags": [
        "PostgreSQL",
        "Database",
        "Autovacuum",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 32-bit transaction IDs (XIDs) with circular modulo comparison, meaning only 2^31 active transactions can be compared before wraparound occurs. To prevent data corruption, PostgreSQL triggers aggressive emergency autovacuum when <code>datfrozenxid</code> reaches <code>autovacuum_freeze_max_age</code> (default 200M transactions).</p><p>However, if autovacuum workers are starved due to strict cost limits, long-running transactions holding snapshot locks, table-level exclusive locks from migrations, or abandoned replication slots, the vacuum fails to advance <code>datfrozenxid</code>. When the headroom drops below 10M transactions, PostgreSQL enters read-only fail-safe mode and refuses to accept write queries.</p>",
    "root_cause": "Emergency freeze autovacuums fail to complete because autovacuum_vacuum_cost_limit throttles I/O, long-running queries block relation cleanup locks, or abandoned replication slots/orphaned prepared transactions pin xmin horizons.",
    "bad_code": "-- Default or throttled configuration leading to freeze starvation\n-- postgresql.conf\nautovacuum_vacuum_cost_limit = 200     -- Extremely restrictive I/O throttling\nautovacuum_vacuum_cost_delay = 20ms    -- High delay per cost limit reached\nautovacuum_max_workers = 3\nautovacuum_freeze_max_age = 200000000\n\n-- Starvation scenario: Long-running idle transaction pinning old xmin\nBEGIN;\nSELECT * FROM orders WHERE created_at < NOW() - INTERVAL '14 days';\n-- Connection left open indefinitely without COMMIT or ROLLBACK",
    "solution_desc": "Tune autovacuum settings specifically for high-throughput freezing by disabling cost throttling on critical tables, increase `autovacuum_vacuum_cost_limit`, identify and terminate old blocking transactions/prepared transactions, drop dead replication slots, and run manual parallel `VACUUM FREEZE` on the affected relations.",
    "good_code": "-- Step 1: Detect transactions, prepared queries, or slots pinning the oldest XID\nSELECT pid, now() - xact_start AS duration, query, state\nFROM pg_stat_activity\nWHERE backend_xmin IS NOT NULL OR backend_xid IS NOT NULL\nORDER BY age(backend_xmin) DESC\nLIMIT 5;\n\n-- Step 2: Drop inactive replication slots pinning catalog xmin\nSELECT slot_name, active, age(xmin), age(catalog_xmin) \nFROM pg_replication_slots \nWHERE active = false;\n-- SELECT pg_drop_replication_slot('abandoned_slot_name');\n\n-- Step 3: Temporary unthrottled freeze vacuum session parameters\nSET vacuum_cost_delay = 0;\nSET maintenance_work_mem = '4GB';\nSET max_parallel_maintenance_workers = 4;\n\n-- Step 4: Run targeted parallel freeze on the most critical tables\nVACUUM (FREEZE, VERBOSE, PARALLEL 4) public.high_churn_table;\n\n-- Step 5: Production postgresql.conf tuning for modern NVMe storage\n-- autovacuum_vacuum_cost_limit = 5000\n-- autovacuum_vacuum_cost_delay = 2ms\n-- autovacuum_max_workers = 8",
    "verification": "Query `SELECT datname, age(datfrozenxid) FROM pg_database;` to confirm `age(datfrozenxid)` drops significantly below `autovacuum_freeze_max_age`. Check `pg_stat_progress_vacuum` to verify ongoing freeze completion.",
    "date": "2026-08-16",
    "id": 1786840942,
    "type": "error"
});