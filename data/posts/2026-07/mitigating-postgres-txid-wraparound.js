window.onPostDataLoaded({
    "title": "Mitigating Postgres TXID Wraparound",
    "slug": "mitigating-postgres-txid-wraparound",
    "language": "SQL",
    "code": "TxIDWraparound",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on Multiversion Concurrency Control (MVCC) to manage transaction states. It tracks transactions using a 32-bit transaction ID (TXID) counter, which allows for ~4.2 billion transactions. To prevent counter wraparound (where a new transaction is seen as occurring in the past), PostgreSQL must periodically 'freeze' old rows using the VACUUM process. Under heavy write loads, if autovacuum parameters are tuned too conservatively or long-running transactions block progress, the TXID counter can approach the critical wraparound limit, putting the database in read-only safe mode.</p>",
    "root_cause": "Conservative autovacuum settings or orphaned replication slots prevent PostgreSQL from cleaning and freezing old transaction IDs faster than the rate of new transaction consumption.",
    "bad_code": "-- BUG: Inactive autovacuum settings and high scaling factors that postpone crucial freezes\nALTER SYSTEM SET autovacuum = off;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.5;\nSELECT pg_reload_conf();",
    "solution_desc": "Enable aggressive autovacuuming configurations by reducing the freeze limits, lowering scale factors, and increasing cost limits. Additionally, regularly clean up orphaned prepared transactions, stale replication slots, and run manual vacuums during maintenance windows.",
    "good_code": "-- FIX: Optimize and aggressively configure autovacuum for heavy write databases\nALTER SYSTEM SET autovacuum = on;\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000; -- Aggressive freeze limit\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05; -- Trigger vacuum after 5% row changes\nSELECT pg_reload_conf();\n\n-- Force manual freeze on hot-spot tables\nVACUUM FREEZE ANALYZE;",
    "verification": "Monitor the transaction ID age of databases by running: SELECT datname, age(datfrozenxid) FROM pg_database; Ensure the age stays well below 200,000,000.",
    "date": "2026-07-05",
    "id": 1783233061,
    "type": "error"
});