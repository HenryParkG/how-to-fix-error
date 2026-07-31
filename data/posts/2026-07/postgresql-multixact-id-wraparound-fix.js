window.onPostDataLoaded({
    "title": "Fix PostgreSQL MultiXact ID Wraparound Outages",
    "slug": "postgresql-multixact-id-wraparound-fix",
    "language": "SQL",
    "code": "WraparoundError",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses MultiXact IDs (multixacts) when multiple transactions concurrently lock rows in shared mode using SELECT ... FOR SHARE or FOR KEY SHARE. Under high write load with heavy SELECT ... FOR SHARE queries, the 32-bit MultiXact ID counter rapidly increments toward wraparound limits.</p><p>If autovacuum falls behind on freezing MultiXact IDs, PostgreSQL enters a safety emergency shutdown mode with the error 'ERROR: MultiXactId 2147483648 has occurred before the oldest valid MultiXactId', rejecting all write traffic until an emergency single-user VACUUM FREEZE completes.</p>",
    "root_cause": "Exhaustion of the 2^32 MultiXact ID space caused by aggressive row-level shared locks combined with high write volume and un-optimized autovacuum parameters (such as autovacuum_multixact_freeze_max_age being too high or vacuum_cost_limit throttling autovacuum context).",
    "bad_code": "-- Application code causing excessive MultiXact generation rate\nSELECT * FROM orders WHERE status = 'PENDING' FOR KEY SHARE;\n\n-- Unoptimized postgresql.conf settings under high concurrency\nautovacuum_multixact_freeze_max_age = 400000000\nvacuum_cost_limit = 200\nautovacuum_vacuum_cost_limit = -1",
    "solution_desc": "Lower autovacuum_multixact_freeze_max_age to initiate background multixact freezing sooner, increase vacuum cost limits to allow autovacuum workers to keep pace with write load, replace explicit row shared locks with optimistic locking patterns where possible, and manually run VACUUM FREEZE on critical tables.",
    "good_code": "-- Tune engine parameters in postgresql.conf for aggressive MultiXact maintenance\nALTER SYSTEM SET autovacuum_multixact_freeze_max_age = 100000000;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_max_workers = 6;\nSELECT pg_reload_conf();\n\n-- Execute emergency manual freeze on high-churn tables before emergency threshold\nVACUUM FREEZE ANALYZE VERBOSE public.orders;\n\n-- Monitor tables closest to MultiXact wraparound\nSELECT c.oid::regclass AS table_name,\n       greatest(age(c.relminmxid), mxid_age(c.relminmxid)) AS multixact_age\nFROM pg_class c\nJOIN pg_namespace n ON n.oid = c.relnamespace\nWHERE c.relkind = 'r' AND n.nspname NOT IN ('pg_catalog', 'information_schema')\nORDER BY multixact_age DESC LIMIT 10;",
    "verification": "Query 'SELECT datname, datminmxid, mxid_age(datminmxid) FROM pg_database;' and verify that mxid_age remains stabilized well below 100,000,000 under peak application load.",
    "date": "2026-07-31",
    "id": 1785496890,
    "type": "error"
});