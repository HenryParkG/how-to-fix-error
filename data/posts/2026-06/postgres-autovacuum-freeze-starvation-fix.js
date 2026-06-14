window.onPostDataLoaded({
    "title": "Mitigate Postgres Autovacuum Freeze Starvation",
    "slug": "postgres-autovacuum-freeze-starvation-fix",
    "language": "SQL",
    "code": "TXID Wraparound Starvation",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses Multiversion Concurrency Control (MVCC) to ensure isolation. Deleted and updated tuples are physically kept until an autovacuum freezes old transaction IDs (TXIDs). Under high-volume write cycles, lock contention or highly restrictive default autovacuum limits prevent cleanup workers from running, leading to TXID wraparound starvation and forced database shutdowns.</p>",
    "root_cause": "The autovacuum cost-limiting variables throttle cleaning operations excessively, while concurrent lock-heavy transactions routinely preempt autovacuum workers.",
    "bad_code": "# Default postgresql.conf settings under high write load\nautovacuum_max_workers = 3\nautovacuum_vacuum_scale_factor = 0.2\nautovacuum_vacuum_cost_limit = 200",
    "solution_desc": "Increase the cost limit ceiling globally and tune specific highly written tables with individual vacuum settings to prevent locking interference.",
    "good_code": "-- Increase autovacuum aggression on specific tables experiencing write intensity\nALTER TABLE heavily_written_table SET (\n  autovacuum_vacuum_scale_factor = 0.05,\n  autovacuum_vacuum_cost_limit = 2000,\n  autovacuum_vacuum_cost_delay = 2\n);",
    "verification": "Query 'pg_database' and evaluate 'age(datfrozenxid)'. Ensure the age is consistently kept below the 'autovacuum_freeze_max_age' threshold.",
    "date": "2026-06-14",
    "id": 1781436253,
    "type": "error"
});