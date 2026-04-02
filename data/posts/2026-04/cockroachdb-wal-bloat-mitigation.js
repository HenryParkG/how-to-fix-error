window.onPostDataLoaded({
    "title": "Mitigating WAL Bloat in CockroachDB Clusters",
    "slug": "cockroachdb-wal-bloat-mitigation",
    "language": "SQL",
    "code": "Storage Bloat",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Write-Ahead Logs (WAL) in CockroachDB (and the underlying Pebble engine) are essential for durability. However, WAL bloat occurs when the engine cannot truncate old logs. This is typically caused by a slow Raft follower that prevents the log prefix from being truncated, or a long-running transaction/snapshot that pins the oldest 'log sequence number' (LSN). In high-throughput clusters, this leads to rapid disk space consumption and potential node crashes.</p>",
    "root_cause": "Raft log truncation is inhibited by a lagging replica or a stale long-lived transaction holding the oldest required LSN.",
    "bad_code": "-- Creating a massive transaction without commits\nBEGIN;\nINSERT INTO sensors SELECT * FROM generate_series(1, 10000000);\n-- Transaction remains open for hours while processing\nSELECT pg_sleep(3600); \nCOMMIT;",
    "solution_desc": "Implement aggressive Raft log truncation settings and monitor replica health. Use smaller, batched transactions and set session timeouts to kill stale connections that hold snapshots open.",
    "good_code": "-- Batch updates to allow WAL truncation\n-- Set a statement timeout to prevent pinning\nSET session_characteristics AS TRANSACTION IDLE IN TRANSACTION SESSION TIMEOUT = '5m';\n\n-- Application side: Loop through batches\n-- UPDATE sensors SET status = 'active' WHERE id BETWEEN 1 AND 1000;\n-- COMMIT; (Repeat)",
    "verification": "Check 'storage.wal.size' metrics in the CockroachDB Admin UI. Ensure 'Raft Log Too Far Behind' events are not triggering.",
    "date": "2026-04-02",
    "id": 1775123589,
    "type": "error"
});