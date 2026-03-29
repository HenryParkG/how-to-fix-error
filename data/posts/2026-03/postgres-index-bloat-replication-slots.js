window.onPostDataLoaded({
    "title": "Fixing Postgres Index Bloat from Abandoned Slots",
    "slug": "postgres-index-bloat-replication-slots",
    "language": "SQL",
    "code": "Index Bloat",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL's logical replication slots are designed to ensure that the primary server doesn't delete data (WAL files and dead tuples) until the replica has consumed it. If a replication slot is 'abandoned' (the consumer disconnects and never returns), the database cannot perform VACUUM on dead tuples because they might still be needed by that slot. This results in massive index bloat and table growth, eventually leading to disk exhaustion.</p>",
    "root_cause": "An inactive replication slot holding back the 'xmin' or 'catalog_xmin' value, preventing autovacuum from reclaiming dead rows.",
    "bad_code": "-- Detection query often ignored by DBAs\nSELECT slot_name, active, restart_lsn \nFROM pg_replication_slots \nWHERE active = 'f';",
    "solution_desc": "Identify and drop any replication slots that have been inactive for an extended period. This allows the background VACUUM process to finally clean up dead tuples.",
    "good_code": "-- 1. Find the offending inactive slot\nSELECT slot_name FROM pg_replication_slots WHERE active = 'f';\n\n-- 2. Drop the slot to release the hold on VACUUM\nSELECT pg_drop_replication_slot('the_abandoned_slot_name');\n\n-- 3. Manually trigger vacuum to reclaim space faster\nVACUUM (ANALYZE, VERBOSE) bloated_table_name;",
    "verification": "Query 'pg_stat_all_tables' and check 'n_dead_tup' to ensure the count is decreasing after dropping the slot.",
    "date": "2026-03-29",
    "id": 1774776557,
    "type": "error"
});