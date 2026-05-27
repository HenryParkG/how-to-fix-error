window.onPostDataLoaded({
    "title": "Fixing Cassandra Latency Spikes from Tombstones",
    "slug": "cassandra-tombstone-saturation-latency-spikes",
    "language": "Cassandra",
    "code": "ReadTimeoutException",
    "tags": [
        "SQL",
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Cassandra, delete operations are soft-deletes that write placeholder markers called 'tombstones' to the disk. Under high-delete or high-TTL workloads, partitions can quickly saturate with millions of these tombstones. When a subsequent read operation targets a partition, Cassandra must scan and merge all live columns along with all non-expired tombstones to construct the correct state of the dataset.</p><p>As the tombstone-to-live-cell ratio grows, read latencies degrade exponentially. Once the scanned tombstone threshold exceeds <code>tombstone_failure_threshold</code> (default 100,000), Cassandra aborts the read request entirely, throwing a <code>ReadTimeoutException</code> or <code>TombstoneOverloadedException</code>, causing critical failures in production applications.</p>",
    "root_cause": "The issue is caused by the default SizeTieredCompactionStrategy (STCS) failing to merge and purge SSTables containing deletes fast enough. This latency, coupled with a high gc_grace_seconds setting, prevents tombstones from being evicted, forcing queries to scan a massive number of expired markers during reads.",
    "bad_code": "CREATE KEYSPACE user_analytics WITH replication = {\n    'class': 'SimpleStrategy',\n    'replication_factor': 3\n};\n\n// BUG: Default compaction strategy and high gc_grace_seconds on high-delete table\nCREATE TABLE user_analytics.active_sessions (\n    user_id uuid,\n    session_id uuid,\n    session_data text,\n    PRIMARY KEY (user_id, session_id)\n) WITH gc_grace_seconds = 864000\n  AND compaction = {\n    'class': 'SizeTieredCompactionStrategy'\n  };",
    "solution_desc": "To fix this, optimize the schema to use LeveledCompactionStrategy (LCS) or TimeWindowCompactionStrategy (TWCS) depending on the access pattern. Reduce gc_grace_seconds to a safe minimum (e.g., 1 day or 3 hours, provided repairs are run regularly) to allow tombstones to be garbage-collected quickly. Additionally, optimize partition sizing to avoid wide partitions, and configure the tombstone warning/failure thresholds to fail-safe limits while resolving the schema design.",
    "good_code": "CREATE KEYSPACE user_analytics WITH replication = {\n    'class': 'SimpleStrategy',\n    'replication_factor': 3\n};\n\n// FIX: Use LeveledCompactionStrategy (LCS) to actively merge SSTables,\n// and significantly reduce gc_grace_seconds to accelerate tombstone eviction.\nCREATE TABLE user_analytics.active_sessions_fixed (\n    user_id uuid,\n    session_id uuid,\n    session_data text,\n    PRIMARY KEY (user_id, session_id)\n) WITH gc_grace_seconds = 86400 \n  AND compaction = {\n    'class': 'LeveledCompactionStrategy',\n    'sstable_size_in_mb': 160,\n    'tombstone_threshold': 0.2\n  }\n  AND read_repair = 'NONE';",
    "verification": "Run a load test with a 10:1 delete-to-read ratio. Monitor the tombstone metrics using 'nodetool tablestats' and inspect 'tombstones scanned' logs. Verify that read latencies stay flat under 10ms and the maximum tombstone scan count stays well below the 1,000 warning threshold.",
    "date": "2026-05-27",
    "id": 1779849239,
    "type": "error"
});