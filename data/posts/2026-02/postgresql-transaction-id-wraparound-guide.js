window.onPostDataLoaded({
    "title": "PostgreSQL TXID Wraparound: The High-Write Silent Shutdown",
    "slug": "postgresql-transaction-id-wraparound-guide",
    "language": "PostgreSQL",
    "code": "TXID Wraparound",
    "tags": [
        "postgresql",
        "database",
        "devops",
        "performance",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit unsigned integer for Transaction IDs (XIDs), providing approximately 4 billion possible IDs. Because these IDs are circular, Postgres treats half of the IDs as in the past and half as in the future. If the counter reaches the 'wraparound' point without old rows being marked as 'frozen', the database risks data corruption where old transactions suddenly appear to be in the future.</p><p>To prevent this, PostgreSQL will forcibly shut down and enter read-only mode once the age of the oldest transaction reaches a safety threshold (usually 200 million transactions before actual wraparound). This is a catastrophic event for high-write systems because the only way to recover is a manual, single-user mode VACUUM which can take hours or days depending on data volume.</p>",
    "root_cause": "The 32-bit XID counter wraps around at ~2.1 billion; if autovacuum fails to 'freeze' old rows faster than new XIDs are consumed, the database hits a safety limit and halts to prevent data loss.",
    "bad_code": "-- Disabling autovacuum or setting a massive freeze age\nALTER TABLE large_table SET (autovacuum_enabled = false);\n-- Or ignoring long-running transactions\nBEGIN;\nSELECT * FROM heavy_report; -- Left open for 3 days",
    "solution_desc": "Tune autovacuum to be more aggressive by reducing the scale factor and increasing the freeze max age, and implement monitoring to alert when the oldest XID age exceeds 100 million.",
    "good_code": "-- Tune autovacuum for high-write tables\nALTER TABLE high_volume_table SET (\n  autovacuum_vacuum_scale_factor = 0.01,\n  autovacuum_vacuum_cost_limit = 1000,\n  autovacuum_freeze_max_age = 200000000\n);\n\n-- Monitoring Query\nSELECT datname, age(datfrozenxid) \nFROM pg_database \nWHERE datallowconn = true \nORDER BY 2 DESC;",
    "verification": "Run 'SELECT age(datfrozenxid) FROM pg_database;' and ensure the returned integer is significantly below 200,000,000.",
    "date": "2026-02-11",
    "id": 1770793122
});