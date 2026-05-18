window.onPostDataLoaded({
    "title": "Mitigating Cassandra Tombstone Overload",
    "slug": "cassandra-tombstone-overload-high-churn",
    "language": "Java",
    "code": "TombstoneOverwhelmingException",
    "tags": [
        "SQL",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Cassandra handles deletions by creating 'tombstones'\u2014markers that signify data has been deleted but not yet physically removed from the SSTables. In high-churn schemas where updates and deletes are frequent, these tombstones accumulate. When a read query is executed, Cassandra must scan these tombstones to ensure it doesn't return deleted data.</p><p>If the tombstone count exceeds the threshold (default 100,000), the query fails. This often happens in time-series data or queue-like patterns where TTLs are short and compaction cannot keep up with the deletion rate.</p>",
    "root_cause": "Read queries scanning across a large number of accumulated tombstones before they are evicted by the compaction process, usually caused by low gc_grace_seconds or inefficient compaction strategies.",
    "bad_code": "CREATE TABLE user_sessions (\n    user_id uuid,\n    session_id uuid,\n    data text,\n    PRIMARY KEY (user_id, session_id)\n) WITH gc_grace_seconds = 864000; -- 10 days default is too long for high churn",
    "solution_desc": "Tune the 'gc_grace_seconds' to a lower value if you have frequent backups or use LeveledCompactionStrategy (LCS) to merge SSTables more aggressively. Additionally, avoid data models that mimic queues (frequent inserts/deletes) and use TTLs strategically to let Cassandra handle expiration naturally.",
    "good_code": "ALTER TABLE user_sessions WITH gc_grace_seconds = 3600\n  AND compaction = {\n    'class': 'LeveledCompactionStrategy',\n    'sstable_size_in_mb': 160\n  };",
    "verification": "Check 'nodetool tablestats' to monitor the tombstone-to-live-cell ratio and verify that queries no longer trigger TombstoneOverwhelmingException in the system logs.",
    "date": "2026-05-18",
    "id": 1779106899,
    "type": "error"
});