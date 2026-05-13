window.onPostDataLoaded({
    "title": "Resolving ScyllaDB Tombstone Saturation in Wide Columns",
    "slug": "scylladb-tombstone-saturation",
    "language": "ScyllaDB",
    "code": "TombstoneSaturation",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In ScyllaDB (and Cassandra), a delete operation doesn't immediately remove data; it writes a 'tombstone'. In wide-column schemas with high churn\u2014where rows are frequently updated or deleted\u2014these tombstones accumulate within a partition. During a read, ScyllaDB must scan over these tombstones to find live data. If the ratio of tombstones to live cells is too high, read latency spikes and the node may trigger a 'TombstoneOverwhelmingException'.</p>",
    "root_cause": "Frequent deletions in a single partition combined with a high 'gc_grace_seconds' setting, preventing the compaction process from purging tombstones early enough.",
    "bad_code": "CREATE TABLE user_activity (\n    user_id uuid,\n    activity_time timestamp,\n    details text,\n    PRIMARY KEY (user_id, activity_time)\n) WITH gc_grace_seconds = 864000; -- 10 days (Default)",
    "solution_desc": "Lower the 'gc_grace_seconds' if data is backed up or repaired frequently. Implement 'SizeTieredCompactionStrategy' (STCS) or 'TimeWindowCompactionStrategy' (TWCS) for time-series data. Enable 'unchecked_tombstone_compaction' to trigger compaction based on tombstone ratios rather than just file size.",
    "good_code": "ALTER TABLE user_activity WITH gc_grace_seconds = 86400 \nAND compaction = {\n    'class': 'SizeTieredCompactionStrategy',\n    'tombstone_threshold': 0.2,\n    'unchecked_tombstone_compaction': true\n};",
    "verification": "Use 'nodetool tablestats' to monitor the 'Average tombstones per slice' and ensure it remains within acceptable limits (e.g., < 100).",
    "date": "2026-05-13",
    "id": 1778638332,
    "type": "error"
});