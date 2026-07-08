window.onPostDataLoaded({
    "title": "Mitigating Cassandra Tombstone Saturation Read Latency",
    "slug": "cassandra-tombstone-saturation-read-latency",
    "language": "Java",
    "code": "Read Latency",
    "tags": [
        "Cassandra",
        "NoSQL",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Apache Cassandra uses tombstones to mark deleted data. When performing range scans or reads on columns with high deletion or TTL expiration rates, Cassandra must scan through thousands of tombstoned cells before finding live data. This causes massive garbage collection pauses, read latency spikes, and eventual query failures with TombstoneOverloadedException.</p>",
    "root_cause": "High delete-to-write ratios combined with suboptimal compaction strategies that do not merge deleted SSTables quickly enough.",
    "bad_code": "ALTER TABLE users WITH compaction = {\n  'class': 'SizeTieredCompactionStrategy'\n};",
    "solution_desc": "Switch the compaction strategy to LeveledCompactionStrategy (LCS) or TimeWindowCompactionStrategy (TWCS) depending on the data pattern, and lower the gc_grace_seconds parameter to allow quicker tombstone purging during compaction.",
    "good_code": "ALTER TABLE users WITH compaction = {\n  'class': 'LeveledCompactionStrategy',\n  'sstable_size_in_mb': 160\n}\nAND gc_grace_seconds = 86400;",
    "verification": "Query the system logs for tombstone warnings and use nodetool tablestats to verify the average tombstone-to-live-cells ratio.",
    "date": "2026-07-08",
    "id": 1783475384,
    "type": "error"
});