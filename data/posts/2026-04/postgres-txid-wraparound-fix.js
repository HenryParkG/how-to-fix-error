window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-fix",
    "language": "SQL",
    "code": "Database-Halt",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID). When the TXID counter reaches its limit, the database forces a read-only mode to prevent data loss. Under extreme write pressure, the autovacuum process may fail to 'freeze' old tuples fast enough, leading to a catastrophic shutdown.</p>",
    "root_cause": "Autovacuum worker starvation and conservative default vacuum settings failing to keep pace with high-velocity INSERT/UPDATE workloads.",
    "bad_code": "-- Default settings unsuitable for 50k+ TPS\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Aggressively tune autovacuum parameters to trigger freezing earlier and increase the worker's resource allowance to clear the TXID backlog.",
    "good_code": "-- Aggressive freezing configuration\nALTER SYSTEM SET autovacuum_freeze_max_age = 1000000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_work_mem = '1GB';\nVACUUM FREEZE ANALYZE;",
    "verification": "Monitor 'age(datfrozenxid)' in 'pg_database'. The value should stabilize well below the 2 billion wraparound threshold.",
    "date": "2026-04-09",
    "id": 1775729235,
    "type": "error"
});