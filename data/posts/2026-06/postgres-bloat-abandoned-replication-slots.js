window.onPostDataLoaded({
    "title": "Fixing Postgres Bloat from Abandoned Replication Slots",
    "slug": "postgres-bloat-abandoned-replication-slots",
    "language": "SQL",
    "code": "Table Bloat & WAL Exhaustion",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses Multi-Version Concurrency Control (MVCC) to manage concurrent transactions. When a row is updated or deleted, Postgres does not immediately remove it; instead, it creates a new version of the row and marks the old version as a 'dead tuple'. The autovacuum daemon is responsible for cleaning up these dead tuples once they are no longer visible to any active transactions.</p><p>Replication slots (both physical and logical) ensure that the primary server does not discard Write-Ahead Log (WAL) segments before they are consumed by standby nodes or analytical pipelines. However, if a replication client disconnects and the slot is abandoned, PostgreSQL guarantees delivery by holding on to all WAL records starting from the slot's last confirmed Log Sequence Number (LSN). Crucially, the slot also freezes the minimum transaction ID (xmin) horizon. As a result, autovacuum cannot clean up any dead tuples created after that xmin. This leads to runaway table bloat, drastic query performance degradation, and eventual disk exhaustion from WAL buildup.</p>",
    "root_cause": "An inactive replication slot pins the xmin horizon and LSN, preventing Postgres from purging old WAL files and blocking autovacuum from reclaiming space occupied by dead tuples.",
    "bad_code": "-- A slot is created for an analytical microservice but the consumer is shut down\nSELECT pg_create_logical_replication_slot('analytics_slot', 'pgoutput');\n\n-- Over time, the consumer is decommissioned, leaving the slot inactive indefinitely\n-- No safety limit exists to drop or invalidate this slot automatically",
    "solution_desc": "To resolve and prevent this, first identify and drop any inactive replication slots to allow autovacuum and WAL archivers to resume operation. To prevent future storage outages, configure 'max_slot_wal_keep_size' in postgresql.conf, which invalidates replication slots automatically if they fall behind by more than a specified threshold of WAL data.",
    "good_code": "-- 1. Find inactive replication slots immediately\nSELECT slot_name, active, wal_status \nFROM pg_replication_slots \nWHERE active = false;\n\n-- 2. Drop the offending abandoned slot to free the xmin horizon\nSELECT pg_drop_replication_slot('analytics_slot');\n\n-- 3. In postgresql.conf, set a safety limit (e.g., 20GB) to auto-invalidate dead slots\n-- max_slot_wal_keep_size = '20GB'",
    "verification": "Query 'pg_replication_slots' to verify the slot is gone. Check disk space recovery using 'df -h' as Postgres cleans up WALs. Run 'VACUUM VERBOSE' on heavily bloated tables to verify that dead tuples are now actively being reclaimed.",
    "date": "2026-06-17",
    "id": 1781664468,
    "type": "error"
});