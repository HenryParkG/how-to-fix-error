window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-txid-wraparound-mitigation",
    "language": "SQL",
    "code": "TXID Exhaustion",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit integer for Transaction IDs (XIDs), providing approximately 4 billion transactions. To prevent 'wraparound'\u2014where old transactions suddenly appear in the future\u2014PostgreSQL must periodically 'freeze' old rows. In high-throughput clusters, if autovacuum cannot keep up with the rate of XID generation, the database will eventually reach a safety limit and shut down to prevent data corruption. This is a critical risk for systems performing millions of writes per day.</p>",
    "root_cause": "The autovacuum process is either too slow, throttled by cost-limit settings, or blocked by long-running transactions/orphaned prepared transactions, preventing the 'datfrozenxid' from advancing.",
    "bad_code": "-- Default settings often too conservative for high throughput\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;",
    "solution_desc": "Tune autovacuum to be more aggressive by reducing the scale factor and increasing the cost limit. Manually identify and kill long-running transactions that prevent vacuuming from cleaning up old XIDs. Set 'autovacuum_freeze_max_age' to a lower value to trigger vacuuming earlier.",
    "good_code": "ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.02;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n-- Monitor progress:\nSELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;",
    "verification": "Query 'pg_database' to ensure 'age(datfrozenxid)' is decreasing after autovacuum runs. Monitor 'pg_stat_activity' for 'autovacuum: VACUUM (to prevent wraparound)' tasks.",
    "date": "2026-03-26",
    "id": 1774508299,
    "type": "error"
});