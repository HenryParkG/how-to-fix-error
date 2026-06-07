window.onPostDataLoaded({
    "title": "Fixing Cassandra Tombstone Saturation Read Spikes",
    "slug": "fixing-cassandra-tombstone-saturation-latency",
    "language": "Cassandra",
    "code": "ReadTimeoutException",
    "tags": [
        "Cassandra",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Cassandra, delete operations do not immediately wipe records from SSTables. Instead, they write an immutable marker called a 'tombstone'. When a client initiates a read query, Cassandra must scan active cells alongside all uncollected tombstones. If a table has a high volume of writes with time-to-live (TTL) expiries or direct deletions, querying the partition forces a scan of thousands of tombstones, causing severe read latency spikes and eventual timeouts.</p>",
    "root_cause": "The number of scanned tombstones per query exceeds the safe default 'tombstone_failure_threshold' limit, triggering a hard query failure and driving Cassandra read amplification.",
    "bad_code": "CREATE TABLE user_sessions (\n    user_id uuid,\n    session_id uuid,\n    payload text,\n    PRIMARY KEY (user_id, session_id)\n) WITH gc_grace_seconds = 864000; -- 10 day grace window allows tombstone build up",
    "solution_desc": "Architecturally resolve the accumulation by dropping 'gc_grace_seconds' on single-datacenter set-ups, and tune the table to use more aggressive tombstone-aware compaction strategies.",
    "good_code": "CREATE TABLE user_sessions (\n    user_id uuid,\n    session_id uuid,\n    payload text,\n    PRIMARY KEY (user_id, session_id)\n) WITH gc_grace_seconds = 86400\n  AND compaction = {\n      'class': 'SizeTieredCompactionStrategy',\n      'tombstone_threshold': 0.2,\n      'tombstone_compaction_interval': 86400\n  };",
    "verification": "Connect via cqlsh and enable query tracking using 'TRACING ON;'. Execute the read queries and look for 'Read X tombstones' logs to verify that the tombstone scan-to-live-cell ratio remains minimal.",
    "date": "2026-06-07",
    "id": 1780830233,
    "type": "error"
});