window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound Autovacuum Starvation",
    "slug": "postgresql-txid-wraparound-autovacuum-starvation",
    "language": "SQL",
    "code": "Autovacuum Starvation",
    "tags": [
        "PostgreSQL",
        "SQL",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on a 32-bit Transaction ID (TXID) space. When the number of transactions approaches $2^{31}$, Postgres must freeze old rows to prevent transaction ID wraparound, which would cause historical data to appear in the future or disappear. The <code>autovacuum</code> daemon handles freezing automatically. However, when long-running analytic queries, abandoned replication slots, or uncommitted 2PC (Two-Phase Commit) transactions hold back the database-wide minimum active transaction age (<code>xmin</code>), autovacuum cannot freeze tuples beyond that point. This leads to autovacuum starvation, raising the database's oldest transaction age until it hits the critical <code>autovacuum_freeze_max_age</code>, forcing PostgreSQL to enter a safety read-only state.</p>",
    "root_cause": "The root cause is the preservation of the oldest active transaction age (<code>xmin</code>) by active sessions, abandoned replication slots, or orphaned prepared transactions. This prevents autovacuum from advancing the database-wide <code>datfrozenxid</code>, ultimately leading to transaction ID exhaustion.",
    "bad_code": "-- DANGER: This configuration restricts Autovacuum execution speed \n-- while long-running queries remain unchecked, starving freeze operations:\nALTER SYSTEM SET autovacuum_max_workers = 3;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = '20ms';\n\n-- Running this session indefinitely will prevent autovacuum freeze progress:\nBEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT * FROM critical_large_ledger_table WHERE status = 'PENDING';\n-- Connection is kept open for days without committing or rolling back...",
    "solution_desc": "Identify and terminate long-running transactions, drop stale replication slots, and commit or roll back prepared transactions. Scale up autovacuum resources so that vacuum operations execute aggressively. Adjust transaction parameters to automatically terminate idle transactions and long-running queries before they trigger wraparound conditions.",
    "good_code": "-- 1. Configure PostgreSQL to automatically terminate hanging transactions:\nALTER SYSTEM SET idle_in_transaction_session_timeout = '60000'; -- 1 minute\nALTER SYSTEM SET statement_timeout = '1800000'; -- 30 minutes\n\n-- 2. Tune Autovacuum to run with higher throughput and zero throttling under load:\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = '2ms';\nSELECT pg_reload_conf();\n\n-- 3. Query to find and terminate transactions blocking vacuum freeze:\nSELECT \n  pid, \n  age(backend_xmin) AS xmin_age, \n  query, \n  state \nFROM pg_stat_activity \nWHERE backend_xmin IS NOT NULL \nORDER BY age(backend_xmin) DESC \nLIMIT 5;\n\n-- Terminate the top blocking PID if xmin_age is dangerously high (> 10,000,000):\n-- SELECT pg_terminate_backend(blocking_pid);\n\n-- 4. Clean up stale replication slots preventing xmin advancement:\nSELECT slot_name, active, age(xmin) FROM pg_replication_slots WHERE age(xmin) > 10000000;\n-- SELECT pg_drop_replication_slot('stale_slot_name');",
    "verification": "Monitor the transaction age using `SELECT datname, age(datfrozenxid) FROM pg_database;`. Run a manual vacuum on the target tables (`VACUUM FREEZE VERBOSE table_name;`) and confirm that the database age successfully decreases and the autovacuum warning messages in the PostgreSQL system logs cease.",
    "date": "2026-06-07",
    "id": 1780815697,
    "type": "error"
});