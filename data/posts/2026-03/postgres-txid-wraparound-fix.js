window.onPostDataLoaded({
    "title": "Mitigate PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-fix",
    "language": "SQL",
    "code": "TXID_WRAPAROUND",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) system. When the TXID counter reaches approximately 2 billion, the database risks 'wraparound,' where old transactions appear to be in the future. To prevent data loss, PostgreSQL enters a forced read-only mode once the 'datfrozenxid' threshold is breached.</p>",
    "root_cause": "High-churn environments where autovacuum cannot keep pace with transaction generation, preventing the 'freezing' of old tuples.",
    "bad_code": "-- Default aggressive settings often missing\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Aggressively tune autovacuum parameters to trigger more frequent cleanups and manually perform 'VACUUM FREEZE' on the largest tables during maintenance windows.",
    "good_code": "ALTER TABLE high_churn_table SET (autovacuum_vacuum_scale_factor = 0.01,\nautovacuum_vacuum_cost_limit = 1000);\n\n-- Monitor age\nSELECT datname, age(datfrozenxid) FROM pg_database;",
    "verification": "Execute 'SELECT age(datfrozenxid) FROM pg_database' and verify the age is significantly below 'autovacuum_freeze_max_age'.",
    "date": "2026-03-23",
    "id": 1774241871,
    "type": "error"
});