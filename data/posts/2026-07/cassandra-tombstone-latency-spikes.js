window.onPostDataLoaded({
    "title": "Fixing Cassandra Tombstone Latency Spikes",
    "slug": "cassandra-tombstone-latency-spikes",
    "language": "Cassandra",
    "code": "Tombstone Overload",
    "tags": [
        "SQL",
        "Infra",
        "NoSQL",
        "Error Fix"
    ],
    "analysis": "<p>Apache Cassandra is designed for high-write throughput using a Log-Structured Merge-tree (LSM) architecture. Deletions do not overwrite data in place; instead, they write a placeholder marker called a \"tombstone\" with an expiration timestamp. When queries scan partitions, Cassandra must merge active rows with tombstones to resolve the correct state.</p><p>If a partition contains an excessive number of tombstones, read latency degrades exponentially. The query coordinator must scan millions of tombstone keys to return a small subset of active records, resulting in heavy JVM garbage collection pauses and <code>ReadTimeoutException</code> failures.</p>",
    "root_cause": "The root cause is poor schema modeling (treating Cassandra like an active message queue with high insert/delete patterns) combined with high default values for gc_grace_seconds (10 days) and standard SizeTieredCompactionStrategy, which delays the purging of expired tombstones.",
    "bad_code": "-- ANTI-PATTERN: Queue design with highly frequent deletions and long retention.\nCREATE TABLE keyspace.queue_table (\n    queue_id uuid,\n    item_id uuid,\n    payload text,\n    PRIMARY KEY (queue_id, item_id)\n) WITH gc_grace_seconds = 864000\n  AND compaction = {'class': 'SizeTieredCompactionStrategy'};",
    "solution_desc": "To fix tombstone saturation, redesign the table metadata. Reduce `gc_grace_seconds` to a safe threshold (e.g., 1 to 3 days, aligned with your repair scheduling) and switch to the `LeveledCompactionStrategy` (LCS) or `TimeWindowCompactionStrategy` (TWCS) which cleans SSTables more predictably. Additionally, set aggressive limits on maximum tombstone scans.",
    "good_code": "-- OPTIMIZED SCHEMA: Uses LeveledCompaction to isolate and purge deleted partitions quickly.\nCREATE TABLE keyspace.queue_table (\n    queue_id uuid,\n    item_id uuid,\n    payload text,\n    PRIMARY KEY (queue_id, item_id)\n) WITH gc_grace_seconds = 86400\n  AND compaction = {\n      'class': 'LeveledCompactionStrategy',\n      'sstable_size_in_mb': '160',\n      'tombstone_threshold': '0.2'\n  }\n  AND read_repair = 'NONE';",
    "verification": "Validate latency improvements by running `nodetool tablestats` on your cluster. Check the 'Number of tombstones scanned' metrics under production stress tests, ensuring the tombstone-to-live-cells scan ratio stays well below the default warning threshold of 1000.",
    "date": "2026-07-14",
    "id": 1783992618,
    "type": "error"
});