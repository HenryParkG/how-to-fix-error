window.onPostDataLoaded({
    "title": "Resolving PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-transaction-id-wraparound-fix",
    "language": "SQL",
    "code": "TransactionWraparoundError",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system, limiting the number of active transactions to approximately 2.1 billion. In high-write clusters, this limit can be reached rapidly. When the 'age' of the oldest transaction reaches a critical threshold, the database enters a read-only state to prevent data loss. This occurs because XID comparisons rely on modular arithmetic; failing to 'freeze' old transactions makes them appear to be in the future, causing data invisibility.</p>",
    "root_cause": "Aggressive write volumes exceeding the autovacuum freeze rate, or long-running transactions/orphaned prepared transactions preventing the truncation of the clog.",
    "bad_code": "ALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- Default value often too low for high-throughput DBs,\n-- causing premature emergency vacuums during peak load.",
    "solution_desc": "Proactively tune autovacuum parameters to trigger freezing more frequently and increase maintenance workers. Identify and terminate long-running transactions that block the freeze horizon.",
    "good_code": "ALTER SYSTEM SET autovacuum_freeze_max_age = 1000000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET maintenance_work_mem = '2GB';\n\n-- Identify problematic tables\nSELECT relname, age(relfrozenxid) \nFROM pg_class \nWHERE relkind = 'r' \nORDER BY age(relfrozenxid) DESC;",
    "verification": "Monitor 'pg_stat_activity' for long transactions and track 'age(relfrozenxid)' via Prometheus/Grafana to ensure it stays below 800 million.",
    "date": "2026-04-19",
    "id": 1776576104,
    "type": "error"
});