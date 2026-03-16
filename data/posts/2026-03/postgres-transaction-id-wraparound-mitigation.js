window.onPostDataLoaded({
    "title": "Mitigating Postgres Transaction ID Wraparound",
    "slug": "postgres-transaction-id-wraparound-mitigation",
    "language": "SQL",
    "code": "DataLossRisk",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the counter reaches approximately 2 billion transactions, it 'wraps around' and old data may suddenly appear as if it belongs in the future or is invisible. This is a critical failure state that forces the database into read-only mode to prevent data corruption. In high-throughput clusters, the autovacuum process might not keep up with freezing old XIDs, leading to an emergency shutdown.</p>",
    "root_cause": "The autovacuum worker is too slow or throttled, failing to perform 'freeze' operations on old table pages before the age of the oldest transaction reaches the 'autovacuum_freeze_max_age' threshold.",
    "bad_code": "-- Default settings often too conservative for heavy writes\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;\nALTER SYSTEM SET autovacuum_max_workers = 3;",
    "solution_desc": "Aggressively tune autovacuum parameters to increase its throughput and priority. Reduce the cost delay and increase the worker count and cost limit so that vacuuming finishes faster than the transaction growth rate.",
    "good_code": "-- Aggressive autovacuum tuning for high-write loads\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.02;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 10;\nSELECT name, setting FROM pg_settings WHERE name LIKE '%freeze%';",
    "verification": "Monitor the 'age(datfrozenxid)' for all databases. Ensure it stays significantly below 200 million and decreases after autovacuum runs.",
    "date": "2026-03-16",
    "id": 1773637779,
    "type": "error"
});