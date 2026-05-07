window.onPostDataLoaded({
    "title": "Resolving PostgreSQL TXID Wraparound Stalls",
    "slug": "resolve-postgresql-txid-wraparound-stalls",
    "language": "SQL",
    "code": "TXID_WRAPAROUND",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit Transaction ID (TXID). When the TXID counter approaches 2 billion, the database must 'freeze' old transactions to prevent them from appearing to be in the future. In high-churn clusters with large amounts of daily updates/deletes, the autovacuum process may fall behind. If the age of the oldest transaction reaches a critical threshold (typically 200 million transactions from the limit), the database enters a safety-critical stall or read-only mode to prevent data corruption.</p>",
    "root_cause": "Autovacuum worker starvation or misconfiguration prevents the vacuum process from freezing tuples faster than the TXID counter increments, leading to the datfrozenxid horizon hitting the autovacuum_freeze_max_age.",
    "bad_code": "-- Default settings often too slow for high-churn systems\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;",
    "solution_desc": "Tune autovacuum to be more aggressive by reducing the scale factor and increasing the cost limit. This ensures vacuuming triggers more frequently and runs faster. In emergency scenarios, a manual VACUUM FREEZE on the oldest tables is required to move the horizon forward.",
    "good_code": "-- Increase aggressive vacuuming for high-churn environments\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.01; -- Trigger at 1% change\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000; -- Allow more IO for vacuum\nALTER SYSTEM SET autovacuum_max_workers = 10; \n\n-- Manual intervention for specific table\nVACUUM FREEZE VERBOSE heavy_churn_table;",
    "verification": "Run 'SELECT datname, age(datfrozenxid) FROM pg_database;' and ensure the age is significantly lower than autovacuum_freeze_max_age.",
    "date": "2026-05-07",
    "id": 1778151680,
    "type": "error"
});