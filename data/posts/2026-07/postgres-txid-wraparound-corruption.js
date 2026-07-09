window.onPostDataLoaded({
    "title": "Preventing PostgreSQL TXID Wraparound Outages",
    "slug": "postgres-txid-wraparound-corruption",
    "language": "SQL",
    "code": "TXID-Wraparound",
    "tags": [
        "PostgreSQL",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on Multiversion Concurrency Control (MVCC) to handle concurrent operations. Every transaction is assigned a 32-bit sequential transaction ID (TXID), allowing up to 4 billion active transactions. To keep track of old vs. new transactions, PostgreSQL uses modulo arithmetic. However, if a database approaches 2 billion transactions without cleanup, ancient transactions can suddenly appear to be in the future.</p><p>To prevent this catastrophic data corruption, PostgreSQL goes into an emergency safety shutdown (read-only mode) once the transaction age hits critical thresholds. This state can only be fixed by running an aggressive manual vacuum. Autovacuum fails to clean up these tables when blocked by long-running transactions, orphaned replication slots, or abandoned prepared transactions.</p>",
    "root_cause": "Long-lived backend connections, idle transactions, or orphaned replication slots prevent autovacuum from freezing tuple headers and advancing the database's `relfrozenxid` horizon.",
    "bad_code": "-- ANTI-PATTERN: Long-running transaction held open indefinitely\nBEGIN TRANSACTION;\nSELECT * FROM sensitive_orders WHERE status = 'PENDING' FOR UPDATE;\n-- Application leaves this connection open without issuing a COMMIT or ROLLBACK.\n-- This blocks vacuuming of all dead tuples created after this transaction started,\n-- pushing the age of the oldest transaction higher with every write query.",
    "solution_desc": "Identify and terminate long-lived connections, drop abandoned replication slots, and adjust PostgreSQL autovacuum parameters to make vacuum processes trigger more aggressively under high-write workloads.",
    "good_code": "-- Step 1: Query database to find oldest transaction ages\nSELECT datname, age(datfrozenxid) FROM pg_database;\n\n-- Step 2: Identify and kill long-running active/idle transactions (> 2 hours)\nSELECT pid, age(query_start), query, state \nFROM pg_stat_activity \nWHERE state != 'idle' AND query_start < now() - interval '2 hours';\n\nSELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < now() - interval '1 hour';\n\n-- Step 3: Configure aggressive autovacuum thresholds in postgresql.conf\n/*\nautovacuum_vacuum_scale_factor = 0.05\nautovacuum_vacuum_cost_limit = 1000\nautovacuum_max_workers = 5\n*/",
    "verification": "Run the transaction age query: `SELECT age(datfrozenxid) FROM pg_database WHERE datname = 'your_db';`. Ensure the resulting TXID age drops significantly below 10,000,000 after running `VACUUM FREEZE;` on high-churn tables.",
    "date": "2026-07-09",
    "id": 1783597686,
    "type": "error"
});