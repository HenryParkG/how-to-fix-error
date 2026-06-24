window.onPostDataLoaded({
    "title": "Fixing Cassandra Tombstone Saturation Latency",
    "slug": "fixing-cassandra-tombstone-saturation-latency",
    "language": "Cassandra",
    "code": "TombstoneOverwhelmingException",
    "tags": [
        "SQL",
        "Infra",
        "Cassandra",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Cassandra, deletes do not immediately erase data from disk due to the append-only nature of SSTables. Instead, Cassandra writes a marker called a \"tombstone\" containing a timestamp. When a query reads data, Cassandra scans both live records and tombstones to resolve the current state. If a system performs high-frequency deletes or uses short-lived Time-To-Live (TTL) columns within wide partitions, tombstones saturate the SSTables.</p><p>When a read query scans a partition containing thousands of tombstones, read latency spikes dramatically as the database engine consumes high CPU and heap scanning dead records. Once scanned tombstones exceed the threshold configured via <code>tombstone_failure_threshold</code> (default 100,000), Cassandra aborts the query completely with a <code>TombstoneOverwhelmingException</code>.</p>",
    "root_cause": "The root cause is a bad partition key design allowing unbounded partition growth (wide partitions) combined with default Compaction Strategies (e.g., SizeTieredCompactionStrategy) which fail to merge and purge expired tombstones in a timely manner before 'gc_grace_seconds' expires.",
    "bad_code": "CREATE TABLE user_notifications (\n    user_id uuid,\n    notification_id timeuuid,\n    payload text,\n    PRIMARY KEY (user_id, notification_id)\n) WITH gc_grace_seconds = 864000\n  AND compaction = {\n      'class': 'SizeTieredCompactionStrategy'\n  };",
    "solution_desc": "Architectural mitigation involves: 1) Changing the Compaction Strategy to TimeWindowCompactionStrategy (TWCS) for time-series or TTL-heavy workloads, or LeveledCompactionStrategy (LCS) to isolate deleted records rapidly. 2) Safely reducing `gc_grace_seconds` if multi-node replication is fast and reliable. 3) Redesigning partitions to bound their sizes, ensuring we do not scan more than 1,000 tombstones per query.",
    "good_code": "CREATE TABLE user_notifications (\n    user_id uuid,\n    notification_id timeuuid,\n    payload text,\n    PRIMARY KEY (user_id, notification_id)\n) WITH gc_grace_seconds = 86400 \n  -- Reduced to 1 day for faster tombstone eviction\n  AND compaction = {\n      'class': 'TimeWindowCompactionStrategy',\n      'compaction_window_unit': 'DAYS',\n      'compaction_window_size': '1',\n      'timestamp_resolution': 'MICROSECONDS'\n  };",
    "verification": "Verify system health by checking tombstone metrics using `nodetool tablestats` and checking the system logs for warning thresholds (`tombstone_warn_threshold`). Monitor the JMX bean `org.apache.cassandra.db:type=ReadStage` to confirm scanned tombstone-to-live cell ratios drop below 10:1.",
    "date": "2026-06-24",
    "id": 1782268172,
    "type": "error"
});