window.onPostDataLoaded({
    "title": "Fixing Postgres Autovacuum Lock & Wraparound",
    "slug": "postgres-autovacuum-lock-wraparound",
    "language": "SQL",
    "code": "TxIDWraparound",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on Multi-Version Concurrency Control (MVCC) to manage transactions. When a row is updated or deleted, a dead tuple is created. The <code>autovacuum</code> daemon cleans up these dead tuples and updates transaction ID maps to prevent Transaction ID (TxID) wraparound, which occurs at 2 billion transactions and puts the database into a strict, emergency read-only panic state. However, in high-write environments, default autovacuum configurations are far too slow, causing it to fall behind. Worse, long-running active transactions or abandoned replication slots can acquire heavy locks on catalog structures, blocking autovacuum and causing extreme lock contention with standard DML queries.</p>",
    "root_cause": "The default configuration of PostgreSQL caps autovacuum IO velocity using the `autovacuum_vacuum_cost_limit` (typically set to 200) and `autovacuum_vacuum_cost_delay` (20ms). This throttles the disk I/O of autovacuum workers. Additionally, long-running transactions block the advancement of the database's oldest transaction ID (`xmin` horizon).",
    "bad_code": "-- Showing standard sluggish default PostgreSQL configs that trigger wraparound under load\n-- These values limit the performance of autovacuum, making it unable to keep pace with updates.\nALTER SYSTEM SET autovacuum_max_workers = 3;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 20; -- 20ms delay makes autovacuum extremely slow\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200; -- High throttling\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; -- Waits until 20% of the table is dead\nSELECT pg_reload_conf();",
    "solution_desc": "Configure autovacuum to be significantly more aggressive. Raise the worker count, remove the heavy vacuum cost delays, and set table-specific parameters for high-churn tables. In parallel, monitor and terminate long-running transactions, unconsumed replication slots, and orphaned prepared transactions that hold the global xmin horizon back.",
    "good_code": "-- Step 1: Tune global PostgreSQL configurations to supercharge autovacuum throughput\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000; -- Increase cost threshold for faster I/O processing\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2; -- Drop delay from 20ms to 2ms\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05; -- Trigger vacuum at 5% dead tuples instead of 20%\nSELECT pg_reload_conf();\n\n-- Step 2: Set ultra-aggressive parameters on high-write hot tables\nALTER TABLE orders SET (\n    autovacuum_vacuum_scale_factor = 0.01,\n    autovacuum_vacuum_cost_limit = 5000,\n    autovacuum_vacuum_cost_delay = 0\n);\n\n-- Step 3: Diagnostic query to find and terminate queries holding back xmin and blocking vacuum\nSELECT \n    pid, \n    age(backend_xmin) AS xmin_age, \n    query, \n    state \nFROM pg_stat_activity \nWHERE backend_xmin IS NOT NULL \nORDER BY age(backend_xmin) DESC \nLIMIT 5;",
    "verification": "Monitor the transaction ID age of your database using the query: `SELECT max(age(datfrozenxid)) FROM pg_database;`. Ensure this number remains well below 100,000,000. Use `pg_stat_user_tables` to verify that `last_autovacuum` dates are updating frequently.",
    "date": "2026-07-11",
    "id": 1783764585,
    "type": "error"
});