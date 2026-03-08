window.onPostDataLoaded({
    "title": "Mitigating Cassandra Latency from Tombstone Overload",
    "slug": "cassandra-tombstone-latency-fix",
    "language": "Java",
    "code": "TombstoneOverload",
    "tags": [
        "SQL",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Cassandra read latency spikes often occur when a query scans a large number of tombstones (markers for deleted data). Even if the result set is small, the storage engine must process these markers to ensure data consistency, leading to high CPU usage and disk I/O. If the number of tombstones per read exceeds the 'tombstone_failure_threshold', the query fails entirely.</p>",
    "root_cause": "Frequent deletes or null updates on the same partition combined with a high 'gc_grace_seconds' value, preventing the Compaction Strategy from purging old data.",
    "bad_code": "ALTER TABLE user_events WITH gc_grace_seconds = 864000;\n-- Application logic executing:\nDELETE FROM user_events WHERE user_id = '123' AND event_id = '456';\n-- This creates thousands of tombstones if done repeatedly.",
    "solution_desc": "Lower 'gc_grace_seconds' for tables with high churn, switch to LeveledCompactionStrategy (LCS) for better tombstone removal, and optimize the data model to avoid frequent deletions in single large partitions.",
    "good_code": "ALTER TABLE user_events WITH gc_grace_seconds = 3600 \nAND compaction = {'class': 'LeveledCompactionStrategy'};\n-- Application change: Use TTLs instead of explicit deletes where possible\nINSERT INTO user_events (user_id, event_id) VALUES ('1', '2') USING TTL 3600;",
    "verification": "Check 'StorageProxy.TombstoneScannedHistogram' using nodetool tablestats to ensure tombstones per read are below 100.",
    "date": "2026-03-08",
    "id": 1772961662,
    "type": "error"
});