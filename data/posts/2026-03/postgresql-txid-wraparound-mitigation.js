window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-txid-wraparound-mitigation",
    "language": "SQL",
    "code": "TXIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) system. When the counter approaches 2^31 transactions, the system must 'freeze' old rows to prevent them from appearing as if they were created in the future. In high-throughput clusters, if autovacuum processes cannot keep up, the database enters a read-only safety mode to prevent data corruption, effectively causing a total service outage.</p>",
    "root_cause": "Autovacuum settings being too conservative (low worker count or high scale factor) for the rate of transaction ID consumption.",
    "bad_code": "ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Decrease the vacuum scale factor to trigger autovacuum more frequently on large tables and increase the maintenance_work_mem to speed up the freezing process.",
    "good_code": "ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.01;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET maintenance_work_mem = '1GB';",
    "verification": "Monitor 'datfrozenxid' in 'pg_database' and ensure the age(datfrozenxid) remains well below 'autovacuum_freeze_max_age'.",
    "date": "2026-03-28",
    "id": 1774673297,
    "type": "error"
});