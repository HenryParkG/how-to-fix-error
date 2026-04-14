window.onPostDataLoaded({
    "title": "Resolving PostgreSQL Index Bloat from Stale Replication Slots",
    "slug": "postgres-index-bloat-stale-slots",
    "language": "SQL",
    "code": "VacuumFail",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL replication slots are designed to ensure that a primary doesn't delete WAL files or prune dead tuples until they are consumed by a replica. However, if a replication slot becomes inactive (e.g., a replica disconnects), the primary's <code>xmin</code> horizon stays frozen.</p><p>This prevents Autovacuum from cleaning up dead tuples in indexes. As updates occur, the index grows massively (bloat) because the 'garbage' cannot be reclaimed, eventually leading to severe performance degradation and disk exhaustion.</p>",
    "root_cause": "Inactive replication slots holding back the database xmin, preventing autovacuum from reclaiming dead rows (tuples) across all tables.",
    "bad_code": "-- Checking general bloat without looking at slots\nSELECT relname, n_dead_tup \nFROM pg_stat_user_tables \nWHERE n_dead_tup > 10000;",
    "solution_desc": "Identify and drop inactive replication slots or configure a maximum size limit for WAL files retained by slots using 'max_slot_wal_keep_size'.",
    "good_code": "-- 1. Identify stale slots\nSELECT slot_name, slot_type, active, xmin \nFROM pg_replication_slots \nWHERE active = 'f';\n\n-- 2. Drop the stale slot causing the xmin freeze\nSELECT pg_drop_replication_slot('stale_replica_slot_name');\n\n-- 3. Set safety limit (PostgreSQL 13+)\nALTER SYSTEM SET max_slot_wal_keep_size = '5GB';\nSELECT pg_reload_conf();",
    "verification": "Run 'SELECT xmin FROM pg_replication_slots' and verify the value starts advancing. Monitor index size using 'pg_relation_size'.",
    "date": "2026-04-14",
    "id": 1776161286,
    "type": "error"
});