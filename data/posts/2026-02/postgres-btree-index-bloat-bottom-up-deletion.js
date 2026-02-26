window.onPostDataLoaded({
    "title": "Resolving PostgreSQL Index Bloat with Bottom-Up Deletion",
    "slug": "postgres-btree-index-bloat-bottom-up-deletion",
    "language": "SQL",
    "code": "IndexBloat",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL B-Tree indexes often suffer from 'bloat,' where physical disk space is consumed by pointers to dead tuples that have been logically deleted or updated but not yet reclaimed. Prior to PostgreSQL 14, high-frequency updates on indexed columns led to page splits even when the page contained space occupied by logically dead entries. Bottom-up index deletion addresses this by performing 'in-flight' cleanup of duplicates and dead items before a page split is triggered, significantly reducing the frequency of VACUUM operations needed to maintain index health.</p>",
    "root_cause": "MVCC creates new versions of rows on update; if an indexed column changes, the B-Tree grows. Standard B-Tree logic splits pages when full, regardless of whether the space is occupied by dead TIDs (Tuple Identifiers).",
    "bad_code": "-- High update frequency on indexed columns in PG < 14\nCREATE INDEX idx_active_status ON transactions (status);\n-- Result: Index size triples every 24 hours despite constant row count.",
    "solution_desc": "Upgrade to PostgreSQL 14+ to leverage the 'bottom_up_index_deletion' feature. Ensure the 'vacuum_cleanup_index_scale_factor' is tuned and that updates are 'HOT' (Heap Only Tuple) eligible where possible by ensuring indexed columns aren't modified unnecessarily.",
    "good_code": "-- Check index efficiency in PG 14+\nSELECT pg_size_pretty(pg_relation_size('idx_active_status')) AS size;\n-- The engine now automatically deletes dead items during inserts if a split is imminent.",
    "verification": "Monitor 'pg_stat_all_indexes' for 'idx_blks_hit' vs 'idx_blks_read' and use the 'pgstattuple' extension to verify the internal free space percentage.",
    "date": "2026-02-26",
    "id": 1772088579,
    "type": "error"
});