window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-transaction-id-wraparound-fix",
    "language": "SQL",
    "code": "XIDWraparoundWarning",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system for MVCC. Because the counter is finite (approx. 4 billion), it must eventually wrap around. If old transactions are not 'frozen' via vacuuming, the database may misinterpret old data as being in the future, leading to data loss. In high-write clusters, the XID consumption rate can outpace the default autovacuum settings.</p>",
    "root_cause": "Aggressive write workloads combined with conservative autovacuum settings or long-running 'idle in transaction' sessions preventing the vacuum from advancing the 'relfrozenxid'.",
    "bad_code": "ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\n-- This default is often too high for billion-row tables.",
    "solution_desc": "Decrease the autovacuum scale factor to trigger vacuuming more frequently on large tables. Increase 'autovacuum_vacuum_cost_limit' to give the vacuum process more I/O bandwidth and ensure no long-running transactions are held open.",
    "good_code": "ALTER TABLE large_table SET (autovacuum_vacuum_scale_factor = 0.01);\nALTER SYSTEM SET autovacuum_max_workers = 6;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;",
    "verification": "Query 'pg_database' for 'datfrozenxid' age: 'SELECT datname, age(datfrozenxid) FROM pg_database;'. Values should stay well below 200 million.",
    "date": "2026-04-16",
    "id": 1776316997,
    "type": "error"
});