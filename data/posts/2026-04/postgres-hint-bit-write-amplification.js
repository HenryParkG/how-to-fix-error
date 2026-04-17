window.onPostDataLoaded({
    "title": "Resolving PG Hint-Bit Write Amplification on Replicas",
    "slug": "postgres-hint-bit-write-amplification",
    "language": "SQL",
    "code": "WriteAmplification",
    "tags": [
        "SQL",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 'hint bits' to track the commit status of rows directly on the data page. On read-only replicas, when a query encounters a row that hasn't had its hint bits set by the primary, the replica cannot write these bits back to the page. This forces every subsequent read to perform a transaction log lookup (clog), and in some cloud environments, triggers unnecessary WAL logging or cache churn on the primary when those pages are eventually synchronized, leading to massive write amplification during high-read volumes.</p>",
    "root_cause": "Replicas are read-only and cannot persist the 'visibility' status of a tuple. The first reader of a page after a VACUUM or update usually sets these bits; if that reader is on a replica, the work is discarded and repeated for every scan.",
    "bad_code": "-- High volume SELECTs on a freshly imported table on a replica\nSELECT count(*) FROM massive_table; \n-- Observation: High IOPS on replica and WAL growth on Primary",
    "solution_desc": "Proactively trigger a VACUUM (or ANALYZE) on the primary node immediately after large data loads. This ensures the hint bits are set and persisted on the primary's disk, so when the pages are replicated, the status is already 'hinted' for the replica's readers.",
    "good_code": "-- Run on Primary after bulk inserts\nSET maintenance_work_mem = '1GB';\nVACUUM (ANALYZE, FILLFACTOR 90) massive_table;\n-- Now replicas will read the pages with hint bits already set.",
    "verification": "Monitor the 'pg_stat_database' for 'conflicts_confl_snapshot' and check if replica CPU usage drops for the same query volume after a primary VACUUM.",
    "date": "2026-04-17",
    "id": 1776420380,
    "type": "error"
});