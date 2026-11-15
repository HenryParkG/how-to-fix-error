window.onPostDataLoaded({
    "title": "Fixing Postgres Logical Replication Slot WAL Bloat",
    "slug": "postgres-logical-replication-slot-wal-bloat",
    "language": "SQL",
    "code": "PG_WAL_DISK_EXHAUSTION",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL logical replication uses replication slots to guarantee that the primary does not remove Write-Ahead Log (WAL) records before the subscriber consumes them. When a downstream consumer disconnects, fails silently, or processes changes too slowly, the slot's `restart_lsn` remains stagnant.</p><p>By default, PostgreSQL maintains all WAL files generated since that LSN. In high-write environments, this leads to rapid accumulation of 16MB WAL segments in the `pg_wal` directory. Without storage circuit breakers, the underlying filesystem hits 100% capacity, forcing the PostgreSQL primary instance into immediate emergency shutdown to prevent data corruption.</p>",
    "root_cause": "Uncapped WAL retention on stalled logical replication slots due to missing `max_slot_wal_keep_size` constraints.",
    "bad_code": "-- Standard slot creation without retention boundaries\nSELECT pg_create_logical_replication_slot('cdc_analytics_slot', 'pgoutput');\n\n-- Default postgresql.conf missing retention safety limits:\n-- wal_keep_size = 1GB\n-- max_slot_wal_keep_size = -1 (unlimited retention)",
    "solution_desc": "Set `max_slot_wal_keep_size` to limit disk retention per slot. When this threshold is exceeded, Postgres invalidates the lagging slot instead of crashing the primary. Additionally, monitor WAL lag through `pg_replication_slots` and drop orphan slots.",
    "good_code": "-- 1. Apply safety boundary in postgresql.conf or dynamically\nALTER SYSTEM SET max_slot_wal_keep_size = '64GB';\nSELECT pg_reload_conf();\n\n-- 2. Inspect lagging or inactive replication slots\nSELECT slot_name, plugin, active,\n       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_bytes\nFROM pg_replication_slots\nWHERE active = false OR pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) > 10737418240;\n\n-- 3. Drop orphaned slot if blocking disk recovery\nSELECT pg_drop_replication_slot('cdc_analytics_slot');",
    "verification": "Check slot status with `SELECT slot_name, wal_status FROM pg_replication_slots;`. Verify `wal_status` displays `normal` or `reserved`, and confirm `pg_wal` disk utilization remains bounded beneath the configured ceiling.",
    "date": "2026-11-15",
    "id": 1794749048,
    "type": "error"
});