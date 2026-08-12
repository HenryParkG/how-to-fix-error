window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound Autovacuum Starvation",
    "slug": "postgres-txid-wraparound-autovacuum-starvation",
    "language": "SQL",
    "code": "ERRDATA: Database Shutdown Imminent",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Database",
        "Autovacuum",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on a 32-bit Transaction ID (TXID) counter. To prevent wraparound, autovacuum must freeze old tuples before the database reaches 2 billion transactions. Under heavy write workloads, default autovacuum configurations are frequently starved or cancelled due to lock contention (`AccessExclusiveLock` requests) or insufficient cost limits.</p><p>When the age of the oldest un-frozen TXID exceeds `autovacuum_freeze_max_age`, PostgreSQL enters emergency anti-wraparound protection, enforcing single-user administrative modes or forcing system-wide read-only state to prevent catalog corruption.</p>",
    "root_cause": "Conservative autovacuum cost delays and restrictive worker concurrency limits cause background vacuum operations to lag behind rapid transaction ID generation rates, starving freeze processes under intense write traffic.",
    "bad_code": "-- Default postgreSQL parameters prone to autovacuum starvation\n-- postgresql.conf defaults:\n-- autovacuum_max_workers = 3\n-- autovacuum_vacuum_cost_limit = 200\n-- autovacuum_vacuum_cost_delay = 20ms\n-- autovacuum_freeze_max_age = 200000000\n\n-- Inspecting TXID age showing dangerously high wraparound risk\nSELECT datname, age(datfrozenxid) FROM pg_database WHERE age(datfrozenxid) > 150000000;",
    "solution_desc": "Scale up autovacuum workers and cost limits, zero out cost delays for high-throughput tables, lower autovacuum freeze thresholds, and configure aggressive table-level settings specifically targeted at high-volume write tables to ensure continuous non-blocking tuple freezing.",
    "good_code": "-- Apply aggressive table-level autovacuum settings for high-write tables\nALTER TABLE high_throughput_events SET (\n    autovacuum_vacuum_cost_delay = 0,\n    autovacuum_vacuum_cost_limit = 10000,\n    autovacuum_freeze_min_age = 10000000,\n    autovacuum_freeze_table_age = 100000000\n);\n\n-- System-wide postgresql.conf performance tuning:\n-- autovacuum_max_workers = 8\n-- autovacuum_vacuum_cost_limit = 3000\n-- autovacuum_vacuum_cost_delay = 2ms",
    "verification": "Query `pg_stat_activity` and verify autovacuum worker processes are actively executing without being cancelled, and track `SELECT max(age(datfrozenxid)) FROM pg_database;` to confirm transaction age decreases standardly.",
    "date": "2026-08-12",
    "id": 1786528438,
    "type": "error"
});