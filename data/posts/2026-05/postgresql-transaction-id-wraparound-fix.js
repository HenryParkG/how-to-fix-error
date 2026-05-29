window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Transaction ID Wraparound Failures",
    "slug": "postgresql-transaction-id-wraparound-fix",
    "language": "PostgreSQL",
    "code": "TXID Wraparound",
    "tags": [
        "PostgreSQL",
        "SQL",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit unsigned integer to track transaction identifiers (TXIDs), meaning it can handle up to 4 billion transactions before they wrap around. When active transaction ages approach this limit (specifically, 2 billion transactions since the last vacuum), PostgreSQL triggers protective measures. First, it issues warning messages. If the situation is not resolved and the age reaches the critical threshold, PostgreSQL halts all write transactions and enters a forced read-only mode to prevent silent data corruption.</p>",
    "root_cause": "The automatic vacuum daemon (autovacuum) fails to freeze old transaction IDs because it is continuously blocked by long-running user transactions, active logical replication slots that are abandoned, or uncommitted prepared transactions (two-phase commits).",
    "bad_code": "-- Bad practice: Long-running transactions blocking autovacuum\nBEGIN;\nSELECT * FROM large_table WHERE status = 'pending' FOR UPDATE;\n-- Transaction remains uncommitted indefinitely because of connection pooling issues or application logic errors\n-- This blocks the freezing of any transaction IDs created after this transaction's start.",
    "solution_desc": "Identify and terminate lingering backend transactions, drop obsolete replication slots, and roll back or commit abandoned prepared transactions. Then, configure autovacuum to run aggressively on heavily modified tables by reducing scale factors and increasing vacuum cost limits.",
    "good_code": "-- 1. Find and terminate transactions active for more than 4 hours\nSELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE state != 'idle'\n  AND query_start < now() - interval '4 hours';\n\n-- 2. Check and drop stale replication slots\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false;\n\n-- 3. Tune postgresql.conf to make autovacuum run more aggressively\n/*\nautovacuum_vacuum_scale_factor = 0.05\nautovacuum_vacuum_cost_limit = 2000\nautovacuum_max_workers = 5\n*/",
    "verification": "Run the query `SELECT max(age(relfrozenxid)) FROM pg_class WHERE relkind = 'r';` to verify that the maximum transaction ID age across your database drops significantly below the protective cutoff (usually 200 million).",
    "date": "2026-05-29",
    "id": 1780020824,
    "type": "error"
});