window.onPostDataLoaded({
    "title": "Resolving PostgreSQL MultiXact ID Exhaustion",
    "slug": "postgresql-multixact-id-exhaustion-fix",
    "language": "SQL",
    "code": "MultiXactLimit",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>MultiXact IDs are used in PostgreSQL to support row-level locking when multiple transactions share a lock (e.g., SELECT FOR SHARE). In high-concurrency environments, these IDs can be consumed rapidly. When the ID counter approaches the 2-billion limit, PostgreSQL enters a safety 'read-only' mode to prevent wraparound and data loss, effectively shutting down write operations.</p>",
    "root_cause": "Excessive row-level locking concurrency combined with autovacuum settings that are too conservative to freeze and reclaim MultiXact IDs fast enough.",
    "bad_code": "-- Default settings often too slow for high-write loads\nALTER SYSTEM SET autovacuum_multixact_freeze_max_age = 400000000;\n-- Aggressive locking without index optimization\nSELECT * FROM orders WHERE status = 'pending' FOR SHARE;",
    "solution_desc": "Manually trigger an aggressive vacuum on the affected tables to freeze MultiXact IDs and adjust autovacuum parameters to be more proactive in high-traffic environments.",
    "good_code": "-- 1. Force a freeze vacuum on specific table\nVACUUM (FREEZE, ANALYZE) orders;\n\n-- 2. Tune autovacuum for MultiXact aggressive cleanup\nALTER TABLE orders SET (autovacuum_multixact_freeze_min_age = 10000000);\nALTER TABLE orders SET (autovacuum_multixact_freeze_table_age = 50000000);",
    "verification": "Check the age of MultiXact IDs using: SELECT datname, age(datminmxid) FROM pg_database;",
    "date": "2026-05-14",
    "id": 1778739392,
    "type": "error"
});