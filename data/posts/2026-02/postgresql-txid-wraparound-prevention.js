window.onPostDataLoaded({
    "title": "Preventing PostgreSQL TXID Wraparound in Multi-Tenant DBs",
    "slug": "postgresql-txid-wraparound-prevention",
    "language": "SQL",
    "code": "WraparoundWarning",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) system, allowing for approximately 4 billion transactions. To manage visibility, it uses a circular buffer where IDs are compared using modulo arithmetic. When a database exceeds ~2 billion transactions without 'freezing' old rows, it risks 'wraparound,' where old data suddenly appears as if it's in the future and becomes invisible. In high-write multi-tenant schemas, where many small tables or massive central tables are hit constantly, the default <code>autovacuum</code> settings often fail to keep pace with the TXID consumption rate.</p>",
    "root_cause": "The transaction ID counter approaching the 2-billion limit faster than the autovacuum process can mark old rows as 'frozen'.",
    "bad_code": "-- Default settings often insufficient for 100k+ writes/sec\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;",
    "solution_desc": "Aggressively tune autovacuum parameters to trigger more frequent freezes. Lower <code>autovacuum_freeze_max_age</code> and increase <code>autovacuum_vacuum_cost_limit</code> to give the worker more throughput. For multi-tenant setups with many small tables, ensure <code>autovacuum_max_workers</code> is high enough to prevent one large tenant from starving others.",
    "good_code": "-- Tune for high-write velocity\nALTER SYSTEM SET autovacuum_freeze_max_age = 100000000;\nALTER SYSTEM SET autovacuum_multixact_freeze_max_age = 100000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER TABLE high_volume_tenant_data SET (autovacuum_vacuum_scale_factor = 0.01);",
    "verification": "Execute `SELECT datname, age(datfrozenxid) FROM pg_database;`. Ensure the 'age' column is consistently below 150,000,000.",
    "date": "2026-02-23",
    "id": 1771829746,
    "type": "error"
});