window.onPostDataLoaded({
    "title": "Mitigating Postgres Transaction ID Wraparound",
    "slug": "mitigating-postgres-txid-wraparound",
    "language": "PostgreSQL",
    "code": "TXID_WRAPAROUND",
    "tags": [
        "SQL",
        "Infra",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system, limiting the total number of concurrent or historical transactions to approximately 2.1 billion. In high-churn multi-tenant environments, where thousands of writes occur per second across many isolated schemas, this limit can be reached in days. If the 'wraparound' occurs, the database becomes read-only to prevent data corruption, potentially causing massive downtime.</p>",
    "root_cause": "The autovacuum process fails to keep up with the 'freeze' map because default settings are too conservative for high-write workloads, leading to 'age(relfrozenxid)' exceeding the 'autovacuum_freeze_max_age'.",
    "bad_code": "-- Default settings often lead to issues in high-churn DBs\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; -- Triggers too late\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000; -- High risk limit",
    "solution_desc": "Proactively tune autovacuum parameters to be more aggressive for high-churn tables and monitor the XID age using system catalogs to trigger manual VACUUM FREEZE during low-traffic windows.",
    "good_code": "-- Tune specifically for multi-tenant high-churn tables\nALTER TABLE tenant_data SET (\n  autovacuum_vacuum_scale_factor = 0.01,\n  autovacuum_vacuum_cost_limit = 1000,\n  autovacuum_freeze_min_age = 50000000\n);\n\n-- Monitor query\nSELECT relname, age(relfrozenxid) \nFROM pg_class \nWHERE relkind = 'r' \nORDER BY age(relfrozenxid) DESC;",
    "verification": "Run 'SELECT datname, age(datfrozenxid) FROM pg_database;' to ensure all values are well below 200 million.",
    "date": "2026-04-30",
    "id": 1777545999,
    "type": "error"
});