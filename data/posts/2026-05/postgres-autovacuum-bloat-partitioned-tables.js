window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Autovacuum Bloat",
    "slug": "postgres-autovacuum-bloat-partitioned-tables",
    "language": "SQL",
    "code": "POSTGRES_AUTOVACUUM_BLOAT",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL partitioning is excellent for scaling large datasets, but it introduces distinct challenges for autovacuum. By default, autovacuum analyzes and vacuums individual partitions but does not efficiently handle global index bloat or release catalog-level locks smoothly on highly active parent tables. This leads to intensive lock contention, preventing transactional updates and causing severe query latency spikes.</p>",
    "root_cause": "Autovacuum operations on parent partitioned tables fail to scale because default autovacuum triggers do not propagate statistics updates quickly enough to the parent, leading to outdated planner statistics and index bloat.",
    "bad_code": "-- Default configuration prone to partitioned table bloat\nALTER TABLE sales_orders SET (\n  autovacuum_vacuum_scale_factor = 0.2,\n  autovacuum_analyze_scale_factor = 0.1\n);\n-- These high scale factors delay vacuuming on active partitions, causing massive bloat.",
    "solution_desc": "Tune the autovacuum settings specifically for individual partitions by decreasing scale factors and increasing autovacuum worker limits. Additionally, manually trigger ANALYZE on the parent table and optimize locking behavior to prevent queue blockages.",
    "good_code": "-- Configure individual partitions with aggressive thresholds\nALTER TABLE sales_orders_y2023m12 SET (\n  autovacuum_vacuum_scale_factor = 0.05,\n  autovacuum_vacuum_threshold = 1000,\n  autovacuum_analyze_scale_factor = 0.02,\n  autovacuum_analyze_threshold = 500\n);\n\n-- Ensure parent table statistics are kept fresh\nANALYZE sales_orders;",
    "verification": "Monitor table bloat using the pgstattuple extension or the pg_stat_user_tables system view, and track lock waiting states using pg_locks to ensure DML queries are no longer blocked by autovacuum tasks.",
    "date": "2026-05-24",
    "id": 1779604145,
    "type": "error"
});