window.onPostDataLoaded({
    "title": "Mitigating Cassandra Tombstones and Read Latency",
    "slug": "cassandra-tombstone-saturation-read-latency",
    "language": "Java",
    "code": "TombstoneOverloadedException",
    "tags": [
        "Java",
        "SQL",
        "Cassandra",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Cassandra, deletions do not overwrite data in-place due to its Log-Structured Merge-tree (LSM) architecture. Instead, a deletion writes a marker known as a 'tombstone'. Tombstones include a deletion timestamp and are merged with active data during sequential read operations. In workloads with high frequencies of data purging, updates, or TTL expirations, tombstones saturate SSTables on disk.</p><p>When a read query scans a partition with excessive tombstones, Cassandra must read both the live records and all valid tombstones. This leads to severe read amplification, high CPU cycles, and garbage collection pauses. Once the number of scanned tombstones in a single query cross the safety threshold (default 100,000), Cassandra throws a `TombstoneOverloadedException` and aborts the query, degrading application availability.</p>",
    "root_cause": "The accumulation of undeleted tombstones across SSTables. This happens when the table configuration uses a high `gc_grace_seconds` value (defaulting to 10 days), preventing tombstones from being removed by compactions until long after they are written, even under intensive write-delete patterns.",
    "bad_code": "-- Creating a table with default garbage collection parameters\nCREATE TABLE user_session_events (\n    user_id uuid,\n    event_id uuid,\n    payload text,\n    PRIMARY KEY (user_id, event_id)\n) WITH gc_grace_seconds = 864000\n  AND compaction = {\n    'class': 'SizeTieredCompactionStrategy',\n    'max_threshold': 32,\n    'min_threshold': 4\n  };",
    "solution_desc": "Architecturally resolve tombstone saturation by: 1) Reducing the `gc_grace_seconds` parameter (if you run repairs frequently or are on a single-datacenter deployment), 2) Changing the compaction strategy to `LeveledCompactionStrategy` (LCS) or `TimeWindowCompactionStrategy` (TWCS) to merge SSTables containing expired tombstones much faster, and 3) Tuning the tombstone threshold settings to trigger aggressive compactions when a table has high tombstone-to-data ratios.",
    "good_code": "-- Optimized table schema designed to quickly purge tombstones\nCREATE TABLE user_session_events (\n    user_id uuid,\n    event_id uuid,\n    payload text,\n    PRIMARY KEY (user_id, event_id)\n) WITH gc_grace_seconds = 86400 -- Reduced to 24 hours (ensure incremental repairs run daily)\n  AND compaction = {\n    'class': 'LeveledCompactionStrategy',\n    'sstable_size_in_mb': 160,\n    'tombstone_threshold': 0.2 -- Triggers aggressive single-table compaction at 20% tombstones\n  }\n  AND read_repair = 'NONE';",
    "verification": "Monitor the tables using Cassandra's nodetool utility. Execute 'nodetool tablestats <keyspace>' to inspect the 'Average tombstone cells scanned per read' metric. Verify that the metric drops and stabilizes below the critical warning limit (1,000 scanned cells).",
    "date": "2026-06-30",
    "id": 1782819835,
    "type": "error"
});